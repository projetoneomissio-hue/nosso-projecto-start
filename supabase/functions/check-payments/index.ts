import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

        // Note: Supabase JS complex filtering can be tricky. 
        // We'll fetch all 'pending' payments and filter in memory for this MVP simplicity 
        // or use a more specific query if volume allows.
        // Let's rely on filter: status=pendente

        const { data: payments, error } = await supabase
            .from("pagamentos")
            .select(`
        id,
        valor,
        data_vencimento,
        ultimo_aviso_data,
        matriculas!inner (
          id,
          alunos!inner (
            nome_completo,
            responsavel_id,
          )
          turmas!inner (
             atividades!inner (nome)
          )
        )
      `)
            .eq("status", "pendente")
            .is("data_pagamento", null);

        if (error) throw error;

        // We need to fetch Profile Emails (Responsavel) manually or via join if relations set up perfectly
        // Relation: matriculas -> alunos -> responsavel_id -> profiles(id)
        // The previous select was missing the join to profiles. Let's fix it.

        // Improved Query with Profiles Join
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
            .eq("status", "pendente");

        if (richError) throw richError;

        // Collect emails to send
        const emailsToSend = [];
        const paymentsToUpdate = [];

        for (const p of richPayments) {
            const dueDate = p.data_vencimento;
            const lastNotice = p.ultimo_aviso_data;
            const studentName = p.matriculas.alunos.nome_completo;
            const activityName = p.matriculas.turmas.atividades.nome;
            const responsavelId = p.matriculas.alunos.responsavel_id;

            // Fetch email for responsavel
            // Optimization: Could batch this, but for MVP loop is okay or use a separate query per user
            const { data: profile } = await supabase.from("profiles").select("email, nome_completo").eq("id", responsavelId).single();

            if (!profile?.email) continue;

            let subject = "";
            let body = "";
            let shouldSend = false;

            if (dueDate === today) {
                // Case: Due Today
                if (lastNotice !== today) {
                    subject = `Lembrete: Mensalidade de ${studentName} vence hoje!`;
                    body = `Olá ${profile.nome_completo},<br/><br/>Lembramos que a mensalidade de <strong>${activityName}</strong> do aluno(a) <strong>${studentName}</strong> vence hoje (${formatDate(today)}).<br/>Valor: R$ ${p.valor}<br/><br/>Por favor, acesse o sistema para realizar o pagamento.`;
                    shouldSend = true;
                }
            } else if (dueDate < today) {
                // Case: Overdue
                // Send if never notified OR notified before today
                if (lastNotice !== today) {
                    subject = `Atenção: Mensalidade de ${studentName} em atraso`;
                    body = `Olá ${profile.nome_completo},<br/><br/>Consta em nosso sistema uma pendência referente à mensalidade de <strong>${activityName}</strong>.<br/>Vencimento: ${formatDate(dueDate)}<br/><br/>Solicitamos que regularize a situação o quanto antes.`;
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
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}
