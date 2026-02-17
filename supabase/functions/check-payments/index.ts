import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is missing");
        }

        const supabase = createClient(
            SUPABASE_URL!,
            SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Buscar pagamentos vencidos (status = pendente, vencimento < hoje)
        // E que não receberam lembrete nos últimos 3 dias
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data: pagamentos, error: fetchError } = await supabase
            .from("pagamentos")
            .select(`
        id,
        valor,
        data_vencimento,
        ultimo_lembrete,
        aluno:alunos(
            nome,
            responsavel:profiles!responsavel_id(email, nome)
        ),
        referencia
      `)
            .eq("status", "pendente")
            .lt("data_vencimento", new Date().toISOString().split('T')[0]) // Vencido antes de hoje
            .or(`ultimo_lembrete.is.null,ultimo_lembrete.lt.${threeDaysAgo.toISOString()}`);

        if (fetchError) throw fetchError;

        if (!pagamentos || pagamentos.length === 0) {
            return new Response(
                JSON.stringify({ message: "Nenhum pagamento pendente para cobrar." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const results = [];

        // 2. Processar cada pagamento
        for (const pg of pagamentos) {
            // @ts-ignore
            const emailResponsavel = pg.aluno?.responsavel?.email;
            // @ts-ignore
            const nomeResponsavel = pg.aluno?.responsavel?.nome || "Responsável";
            // @ts-ignore
            const nomeAluno = pg.aluno?.nome || "Aluno";

            if (!emailResponsavel) {
                results.push({ id: pg.id, status: "skipped", reason: "no email" });
                continue;
            }

            // 3. Enviar Email via Resend
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "NeoMissio <onboarding@resend.dev>", // TODO: Change to verified domain later
                    to: [emailResponsavel],
                    subject: `Lembrete de Pagamento - ${nomeAluno}`,
                    html: `
            <div style="font-family: sans-serif; color: #333;">
              <h2>Olá, ${nomeResponsavel}</h2>
              <p>Esperamos que esteja tudo bem.</p>
              <p>Identificamos que a mensalidade referente a <strong>${pg.referencia || "mensalidade"}</strong> do aluno(a) <strong>${nomeAluno}</strong>, com vencimento em <strong>${pg.data_vencimento}</strong>, ainda consta como pendente em nosso sistema.</p>
              <p>Valor: <strong>R$ ${Number(pg.valor).toFixed(2)}</strong></p>
              <p>Caso já tenha efetuado o pagamento, por favor, desconsidere esta mensagem ou nos envie o comprovante.</p>
              <br/>
              <p>Atenciosamente,<br/>Equipe NeoMissio</p>
            </div>
          `,
                }),
            });

            if (res.ok) {
                // 4. Atualizar ultimo_lembrete
                await supabase
                    .from("pagamentos")
                    .update({ ultimo_lembrete: new Date().toISOString() })
                    .eq("id", pg.id);

                results.push({ id: pg.id, status: "sent", to: emailResponsavel });
            } else {
                const errorData = await res.json();
                results.push({ id: pg.id, status: "failed", error: errorData });
            }
        }

        return new Response(JSON.stringify({ success: true, processed: results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
