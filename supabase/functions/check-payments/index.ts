import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Check Payments - Cobrança Automática
 * 
 * Busca pagamentos vencidos e envia UM e-mail consolidado por responsável.
 * Controle de throttle: não envia mais de 1 lembrete a cada 3 dias.
 * Rate limit: delay de 600ms entre envios para respeitar Resend (2 req/s).
 * 
 * Deve ser executado diariamente via Cron Job do Supabase.
 */

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const hoje = new Date().toISOString().split("T")[0];

        // 1. Buscar pagamentos pendentes que já venceram
        const { data: pagamentos, error: fetchError } = await supabase
            .from("pagamentos")
            .select(`
                id,
                valor,
                data_vencimento,
                ultimo_lembrete,
                gateway_url,
                matricula:matriculas!inner(
                    aluno:alunos!inner(
                        nome_completo,
                        responsavel:profiles!responsavel_id(nome_completo, email, telefone)
                    ),
                    turma:turmas(nome, atividade:atividades(nome))
                )
            `)
            .eq("status", "pendente")
            .lte("data_vencimento", hoje);

        if (fetchError) {
            console.error("[CHECK-PAYMENTS] Fetch error:", fetchError);
            throw fetchError;
        }

        if (!pagamentos || pagamentos.length === 0) {
            console.log("[CHECK-PAYMENTS] Nenhum pagamento vencido encontrado.");
            return new Response(JSON.stringify({
                success: true,
                message: "Nenhum pagamento vencido para cobrar.",
                processed: 0,
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log(`[CHECK-PAYMENTS] ${pagamentos.length} pagamento(s) vencido(s) encontrado(s).`);

        // 2. Filtrar pagamentos que não receberam lembrete nos últimos 3 dias
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const elegiveis = pagamentos.filter((pg: any) => {
            if (!pg.ultimo_lembrete) return true;
            return new Date(pg.ultimo_lembrete) < threeDaysAgo;
        });

        console.log(`[CHECK-PAYMENTS] ${elegiveis.length} elegivel(is) para lembrete (throttle 3 dias).`);

        if (elegiveis.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                message: "Todos os pagamentos vencidos já receberam lembrete nos últimos 3 dias.",
                totalVencidos: pagamentos.length,
                totalElegiveis: 0,
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const results: any[] = [];

        // Helper: sleep to respect Resend rate limit (2 req/s)
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // 3. Agrupar pagamentos elegíveis por e-mail do responsável
        //    (assim enviamos 1 e-mail consolidado por responsável, não 1 por fatura)
        const porResponsavel = new Map<string, { nomeResponsavel: string; pagamentos: any[] }>();

        for (const pg of elegiveis) {
            const matricula = (pg as any).matricula;
            const email = matricula?.aluno?.responsavel?.email;
            const nomeResponsavel = matricula?.aluno?.responsavel?.nome_completo || "Responsável";

            if (!email) {
                results.push({ id: pg.id, status: "skipped", reason: "no_email" });
                continue;
            }

            if (!porResponsavel.has(email)) {
                porResponsavel.set(email, { nomeResponsavel, pagamentos: [] });
            }
            porResponsavel.get(email)!.pagamentos.push(pg);
        }

        console.log(`[CHECK-PAYMENTS] ${porResponsavel.size} responsavel(is) para notificar.`);

        // 4. Enviar e-mail consolidado para cada responsável
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

        if (!RESEND_API_KEY) {
            console.log("[CHECK-PAYMENTS] RESEND_API_KEY ausente — modo mock.");
            for (const [email, { pagamentos: pgs }] of porResponsavel) {
                for (const pg of pgs) {
                    results.push({ id: pg.id, status: "mocked", to: email });
                }
            }
        } else {
            for (const [email, { nomeResponsavel, pagamentos: pgs }] of porResponsavel) {
                // Montar tabela de faturas pendentes
                let totalDevido = 0;
                const linhasFaturas = pgs.map((pg: any) => {
                    const matricula = pg.matricula;
                    const nomeAluno = matricula?.aluno?.nome_completo || "Aluno";
                    const atividade = matricula?.turma?.atividade?.nome || "";
                    const valor = Number(pg.valor);
                    totalDevido += valor;
                    const diasAtraso = Math.floor(
                        (new Date().getTime() - new Date(pg.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const valorFmt = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                    const vencFmt = pg.data_vencimento.split("-").reverse().join("/");
                    const linkBtn = pg.gateway_url
                        ? `<a href="${pg.gateway_url}" style="color:#0f172a;font-weight:bold;text-decoration:underline;">Pagar</a>`
                        : "";
                    return `<tr>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${nomeAluno}${atividade ? ` (${atividade})` : ""}</td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${vencFmt}</td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#dc2626;font-weight:bold;">${diasAtraso}d</td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${valorFmt}</td>
                        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${linkBtn}</td>
                    </tr>`;
                }).join("");

                const totalFmt = totalDevido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

                const emailHtml = `
                <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;padding:20px;">
                    <div style="background-color:#0f172a;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                        <h1 style="color:white;margin:0;font-size:22px;">Neo Missio</h1>
                    </div>
                    <div style="background:white;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
                        <h2 style="color:#dc2626;">⚠️ Lembrete de Pagamento</h2>
                        <p>Olá, <strong>${nomeResponsavel}</strong>!</p>
                        <p>Identificamos <strong>${pgs.length} mensalidade(s) pendente(s)</strong> no valor total de <strong>${totalFmt}</strong>:</p>
                        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
                            <thead>
                                <tr style="background:#f8fafc;">
                                    <th style="padding:10px;text-align:left;border-bottom:2px solid #e2e8f0;">Aluno</th>
                                    <th style="padding:10px;text-align:center;border-bottom:2px solid #e2e8f0;">Vencimento</th>
                                    <th style="padding:10px;text-align:center;border-bottom:2px solid #e2e8f0;">Atraso</th>
                                    <th style="padding:10px;text-align:right;border-bottom:2px solid #e2e8f0;">Valor</th>
                                    <th style="padding:10px;text-align:center;border-bottom:2px solid #e2e8f0;"></th>
                                </tr>
                            </thead>
                            <tbody>${linhasFaturas}</tbody>
                            <tfoot>
                                <tr style="background:#fef2f2;">
                                    <td colspan="3" style="padding:10px;font-weight:bold;">Total Pendente</td>
                                    <td style="padding:10px;text-align:right;font-weight:bold;color:#dc2626;font-size:16px;">${totalFmt}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                        <p style="color:#666;font-size:13px;">Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.</p>
                    </div>
                    <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:15px;">Neo Missio - Centro Social</p>
                </div>`;

                try {
                    const res = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${RESEND_API_KEY}`,
                        },
                        body: JSON.stringify({
                            from: "Neo Missio Financeiro <sistema@neomissio.com.br>",
                            to: [email],
                            subject: `⚠️ ${pgs.length} mensalidade(s) pendente(s) - Total ${totalFmt}`,
                            html: emailHtml,
                        }),
                    });

                    if (!res.ok) {
                        const errData = await res.json();
                        console.error(`[CHECK-PAYMENTS] Resend error for ${email}:`, errData);
                        for (const pg of pgs) {
                            results.push({ id: pg.id, status: "failed", error: errData });
                        }
                    } else {
                        console.log(`[CHECK-PAYMENTS] Lembrete consolidado enviado para ${email} (${pgs.length} faturas)`);
                        // Atualizar ultimo_lembrete de todos os pagamentos deste responsável
                        const ids = pgs.map((pg: any) => pg.id);
                        await supabase
                            .from("pagamentos")
                            .update({ ultimo_lembrete: new Date().toISOString() })
                            .in("id", ids);
                        for (const pg of pgs) {
                            results.push({ id: pg.id, status: "sent", to: email });
                        }
                    }
                } catch (err: any) {
                    console.error(`[CHECK-PAYMENTS] Exception for ${email}:`, err);
                    for (const pg of pgs) {
                        results.push({ id: pg.id, status: "error", error: err.message });
                    }
                }

                // Rate limit: esperar 600ms entre envios
                await sleep(600);
            }
        }

        const summary = {
            success: true,
            totalVencidos: pagamentos.length,
            totalElegiveis: elegiveis.length,
            responsaveisNotificados: porResponsavel.size,
            sent: results.filter(r => r.status === "sent").length,
            skipped: results.filter(r => r.status === "skipped").length,
            failed: results.filter(r => r.status === "failed" || r.status === "error").length,
        };

        console.log("[CHECK-PAYMENTS] Resultado:", JSON.stringify(summary));

        // 5. Enviar e-mail de resumo para a diretoria
        if (RESEND_API_KEY && summary.sent > 0) {
            try {
                // Buscar e-mails da diretoria
                const { data: diretores } = await supabase
                    .from("user_roles")
                    .select("user_id, profile:profiles!user_id(nome_completo, email)")
                    .eq("role", "direcao");

                const emailsDiretoria = diretores
                    ?.map((d: any) => d.profile?.email)
                    .filter(Boolean) || [];

                if (emailsDiretoria.length > 0) {
                    // Montar tabela de resumo
                    const linhasResumo = Array.from(porResponsavel.entries()).map(([email, { nomeResponsavel, pagamentos: pgs }]) => {
                        const enviados = results.filter(r => r.to === email && r.status === "sent").length;
                        const total = pgs.reduce((sum: number, pg: any) => sum + Number(pg.valor), 0);
                        const totalFmt = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                        const status = enviados > 0
                            ? `<span style="color:#16a34a;font-weight:bold;">✅ Enviado</span>`
                            : `<span style="color:#dc2626;font-weight:bold;">❌ Falhou</span>`;
                        return `<tr>
                            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${nomeResponsavel}</td>
                            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${email}</td>
                            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${pgs.length}</td>
                            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${totalFmt}</td>
                            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${status}</td>
                        </tr>`;
                    }).join("");

                    const totalGeral = elegiveis.reduce((sum: number, pg: any) => sum + Number(pg.valor), 0);
                    const totalGeralFmt = totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

                    const hoje = new Date().toLocaleDateString("pt-BR");
                    const resumoHtml = `
                    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;">
                        <div style="background-color:#0f172a;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
                            <h1 style="color:white;margin:0;font-size:22px;">Neo Missio - Relatório de Cobranças</h1>
                        </div>
                        <div style="background:white;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
                            <h2 style="color:#0f172a;">📊 Resumo de Cobranças - ${hoje}</h2>
                            <div style="display:flex;gap:15px;margin:20px 0;">
                                <div style="flex:1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:15px;text-align:center;">
                                    <div style="font-size:28px;font-weight:bold;color:#0f172a;">${summary.totalVencidos}</div>
                                    <div style="color:#64748b;font-size:13px;">Total Vencidos</div>
                                </div>
                                <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:15px;text-align:center;">
                                    <div style="font-size:28px;font-weight:bold;color:#16a34a;">${summary.sent}</div>
                                    <div style="color:#64748b;font-size:13px;">Lembretes Enviados</div>
                                </div>
                                <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:15px;text-align:center;">
                                    <div style="font-size:28px;font-weight:bold;color:#dc2626;">${totalGeralFmt}</div>
                                    <div style="color:#64748b;font-size:13px;">Valor Total Pendente</div>
                                </div>
                            </div>
                            <h3 style="margin-top:25px;color:#334155;">Responsáveis Notificados</h3>
                            <table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:13px;">
                                <thead>
                                    <tr style="background:#f8fafc;">
                                        <th style="padding:10px;text-align:left;border-bottom:2px solid #e2e8f0;">Responsável</th>
                                        <th style="padding:10px;text-align:left;border-bottom:2px solid #e2e8f0;">E-mail</th>
                                        <th style="padding:10px;text-align:center;border-bottom:2px solid #e2e8f0;">Faturas</th>
                                        <th style="padding:10px;text-align:right;border-bottom:2px solid #e2e8f0;">Valor</th>
                                        <th style="padding:10px;text-align:center;border-bottom:2px solid #e2e8f0;">Status</th>
                                    </tr>
                                </thead>
                                <tbody>${linhasResumo}</tbody>
                            </table>
                            <p style="color:#94a3b8;font-size:12px;margin-top:20px;">Este relatório foi gerado automaticamente pelo sistema de cobranças Neo Missio.</p>
                        </div>
                    </div>`;

                    await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${RESEND_API_KEY}`,
                        },
                        body: JSON.stringify({
                            from: "Neo Missio Sistema <sistema@neomissio.com.br>",
                            to: emailsDiretoria,
                            subject: `📊 Relatório de Cobranças ${hoje} - ${summary.sent} lembretes enviados (${totalGeralFmt})`,
                            html: resumoHtml,
                        }),
                    });

                    console.log(`[CHECK-PAYMENTS] Resumo enviado para diretoria: ${emailsDiretoria.join(", ")}`);
                    await sleep(600);
                } else {
                    console.log("[CHECK-PAYMENTS] Nenhum diretor encontrado para enviar resumo.");
                }
            } catch (resumoErr: any) {
                console.error("[CHECK-PAYMENTS] Erro ao enviar resumo para diretoria:", resumoErr);
            }
        }

        return new Response(JSON.stringify(summary), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[CHECK-PAYMENTS] Error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
