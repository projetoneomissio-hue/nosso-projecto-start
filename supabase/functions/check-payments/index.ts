import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

import { PAYMENT_REMINDER_TEMPLATE, PAYMENT_DUE_TODAY_TEMPLATE } from "../_shared/email-templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface PaymentRecord {
    id: string;
    valor: number;
    data_vencimento: string;
    matricula_id: string;
    matriculas: {
        alunos: {
            nome_completo: string;
            responsavel_id: string;
            responsavel: {
                nome_completo: string;
                email: string;
            };
        };
        turmas: {
            atividades: {
                nome: string;
            };
        };
    };
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!
        );

        const today = new Date().toISOString().split("T")[0];

        // 1. Fetch pending payments that need attention
        // Case A: Due Today AND No notice sent today
        // Case B: Overdue AND No notice sent today

        // filter: status=pendente

        const { data: richPayments, error: richError } = await supabase
            .from("pagamentos")
            .select(`
        id,
        valor,
        data_vencimento,
        ultimo_aviso_data,
        matriculas!inner (
          alunos!inner (
            nome_completo,
            responsavel_id
          ),
          turmas!inner (
             atividades!inner (nome)
          )
        )
      `)
            .eq("status", "pendente")
            .is("data_pagamento", null);

        if (richError) throw richError;

        // Collect emails to send
        const emailsToSend = [];
        const paymentsToUpdate = [];

        for (const p of richPayments as any[]) {
            const dueDate = p.data_vencimento;
            const lastNotice = p.ultimo_aviso_data;
            const matriculaData = p.matriculas as any;
            const studentName = matriculaData?.alunos?.nome_completo || "Aluno";
            const activityName = matriculaData?.turmas?.atividades?.nome || "Atividade";
            const responsavelId = matriculaData?.alunos?.responsavel_id;

            if (!responsavelId) continue;

            // Fetch email for responsavel
            const { data: profile } = await supabase.from("profiles").select("email, nome_completo").eq("id", responsavelId).single();

            if (!profile?.email) continue;

            let subject = "";
            let body = "";
            let shouldSend = false;

            // Link simulating payment access (could be dynamic)
            const paymentLink = "https://neomissio.com/financeiro";

            if (dueDate === today) {
                // Case: Due Today
                if (lastNotice !== today) {
                    subject = `Lembrete: Mensalidade de ${studentName} vence hoje!`;
                    body = PAYMENT_DUE_TODAY_TEMPLATE(
                        profile.nome_completo,
                        studentName,
                        activityName,
                        p.valor,
                        paymentLink
                    );
                    shouldSend = true;
                }
            } else if (dueDate < today) {
                // Case: Overdue
                if (lastNotice !== today) {
                    const daysOverdue = Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 3600 * 24));

                    subject = `Atenção: Mensalidade de ${studentName} em atraso`;
                    body = PAYMENT_REMINDER_TEMPLATE(
                        profile.nome_completo,
                        studentName,
                        activityName,
                        p.valor,
                        daysOverdue,
                        paymentLink
                    );
                    shouldSend = true;
                }
            }


            if (shouldSend) {
                emailsToSend.push({
                    to: profile.email,
                    subject,
                    html: body,
                    paymentId: p.id
                });
            }
        }

        console.log(`Found ${emailsToSend.length} emails to send.`);

        // Send Emails via Resend
        const results = [];
        for (const email of emailsToSend) {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "Neo Missio <financeiro@neomissio.com.br>", // Adjust sender as needed
                    to: [email.to],
                    subject: email.subject,
                    html: email.html,
                }),
            });

            if (res.ok) {
                paymentsToUpdate.push(email.paymentId);
                results.push({ email: email.to, status: "sent" });
            } else {
                results.push({ email: email.to, status: "error", error: await res.text() });
            }
        }

        // Update Database
        if (paymentsToUpdate.length > 0) {
            await supabase
                .from("pagamentos")
                .update({ ultimo_aviso_data: today })
                .in("id", paymentsToUpdate);
        }

        return new Response(JSON.stringify({ success: true, processed: results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}
