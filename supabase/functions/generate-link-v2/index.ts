import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentLinkRequest {
  pagamentoId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Client for Auth (identifying the user)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    console.log("[GENERATE-LINK-V2] Function started");

    // 1. Verify Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const user = userData.user;
    console.log("[GENERATE-LINK-V2] User authenticated:", user.email);

    // 2. Initialize Admin Client for Permission Checks & Database Operations
    // We use Service Role Key to bypass RLS for checking roles and reading payment data securely
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Check Permissions (RBAC)
    const { data: roleData, error: roleError } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError) console.error("[GENERATE-LINK-V2] Role check error:", roleError);

    const hasPermission = roleData && ["direcao", "coordenacao"].includes(roleData.role);
    if (!hasPermission) {
      console.error("[GENERATE-LINK-V2] Permission denied. Role found:", roleData?.role);
      throw new Error("Permission denied: requires coordenacao or direcao role");
    }

    // 4. Validate Input
    const { pagamentoId } = await req.json() as PaymentLinkRequest;
    if (!pagamentoId) throw new Error("pagamentoId is required");

    // 5. Fetch Payment Details
    const { data: pagamento, error: pagError } = await supabaseService
      .from("pagamentos")
      .select(`
        id, valor, data_vencimento, status,
        matricula:matriculas!inner(
          aluno:alunos!inner(
            nome_completo
          ),
          turma:turmas!inner(
            nome,
            atividade:atividades!inner(nome)
          )
        )
      `)
      .eq("id", pagamentoId)
      .single();

    if (pagError || !pagamento) throw new Error("Payment not found");

    if (pagamento.status === 'pago') {
      throw new Error("Payment already completed");
    }

    const matricula = pagamento.matricula as any;
    const aluno = matricula.aluno;
    const turma = matricula.turma;
    const atividade = turma.atividade;

    console.log("[GENERATE-LINK-V2] Creating Stripe payment link for:", pagamentoId);

    // 6. Integrate with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Convert value to cents
    const amountInCents = Math.round(Number(pagamento.valor) * 100);

    // Create a price object
    const price = await stripe.prices.create({
      currency: "brl",
      unit_amount: amountInCents,
      product_data: {
        name: `Mensalidade - ${atividade.nome}`,
      },
    });

    // Create Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      payment_method_types: ["card", "pix"],
      metadata: {
        pagamento_id: pagamentoId,
        aluno_nome: aluno.nome_completo,
        atividade: atividade.nome,
      },
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${req.headers.get("origin") || "https://localhost:3000"}/payment-success?payment_id=${pagamentoId}`,
        },
      },
      payment_intent_data: {
        metadata: {
          pagamento_id: pagamentoId
        }
      }
    });

    console.log("[GENERATE-LINK-V2] Link created:", paymentLink.url);

    return new Response(JSON.stringify({
      url: paymentLink.url,
      linkId: paymentLink.id,
      pagamentoId,
      alunoNome: aluno.nome_completo,
      atividadeNome: atividade.nome,
      valor: pagamento.valor,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[GENERATE-LINK-V2] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
