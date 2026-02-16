import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { WELCOME_EMAIL_TEMPLATE } from "../_shared/email-templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    type: "welcome" | "custom";
    subject?: string;
    html?: string;
    data?: {
        nomeResponsavel: string;
        nomeAluno: string;
    };
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { to, type, subject: reqSubject, html: reqHtml, data }: EmailRequest = await req.json();

        let subject = reqSubject;
        let html = reqHtml;

        // Use functionality mapping
        if (type === "welcome" && data) {
            subject = "Bem-vindo ao NeoMissio!";
            html = WELCOME_EMAIL_TEMPLATE(data.nomeResponsavel, data.nomeAluno);
        }

        if (!subject || !html) {
            throw new Error("Missing subject or html content");
        }

        // Fallback: If no API key, log to console (Dev mode)
        if (!RESEND_API_KEY) {
            console.log("------------------------------------------------");
            console.log("📧 [MOCK EMAIL] RESEND_API_KEY is missing.");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log("------------------------------------------------");
            return new Response(JSON.stringify({ success: true, mocked: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "NeoMissio <onboarding@resend.dev>", // Change to verified domain in prod
                to: [to],
                subject: subject,
                html: html,
            }),
        });

        const resData = await res.json();

        if (!res.ok) {
            console.error("Resend API Error:", resData);
            return new Response(JSON.stringify({ error: resData }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify(resData), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
};

serve(handler);
