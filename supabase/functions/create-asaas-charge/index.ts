import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
const ASAAS_URL = Deno.env.get("ASAAS_URL") || "https://sandbox.asaas.com/api/v3"; // Default to Sandbox

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!ASAAS_API_KEY) {
      throw new Error("ASAAS_API_KEY is missing");
    }

    const { aluno_nome, responsavel_nome, responsavel_cpf, responsavel_email, valor, vencimento, forma_pagamento, external_id } = await req.json();

    if (!responsavel_cpf || !valor) {
      throw new Error("Dados obrigatórios faltando (CPF ou Valor)");
    }

    // 1. Buscar ou Criar Cliente no Asaas
    let customerId = "";

    // Busca por CPF
    const searchRes = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${responsavel_cpf}`, {
      headers: { "access_token": ASAAS_API_KEY }
    });
    const searchData = await searchRes.json();

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      // Cria novo cliente
      const createRes = await fetch(`${ASAAS_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": ASAAS_API_KEY
        },
        body: JSON.stringify({
          name: responsavel_nome,
          cpfCnpj: responsavel_cpf,
          email: responsavel_email,
          notificationDisabled: false, // Deixar Asaas enviar e-mail por enquanto
        })
      });
      const createData = await createRes.json();
      if (createData.errors) throw new Error(`Erro ao criar cliente Asaas: ${JSON.stringify(createData.errors)}`);
      customerId = createData.id;
    }

    // 2. Criar Cobrança (Payment)
    const billingType = forma_pagamento === "PIX" ? "PIX" : "BOLETO";

    const paymentBody = {
      customer: customerId,
      billingType: billingType,
      value: valor,
      dueDate: vencimento,
      description: `Mensalidade - Aluno: ${aluno_nome}`,
      externalReference: external_id, // ID do Pagamento no Supabase
      postalService: false // Não enviar por correio
    };

    const chargeRes = await fetch(`${ASAAS_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY
      },
      body: JSON.stringify(paymentBody)
    });

    const chargeData = await chargeRes.json();

    if (chargeData.errors) {
      throw new Error(`Erro ao criar cobrança Asaas: ${JSON.stringify(chargeData.errors)}`);
    }

    // Retorna dados para o frontend salvar na tabela
    return new Response(JSON.stringify({
      success: true,
      gateway_id: chargeData.id,
      gateway_url: chargeData.invoiceUrl, // Link da fatura (Boleto + Pix)
      pix_code: chargeData.billingType === 'PIX' ? chargeData.bankSlipUrl : null // Simplificação, na v3 invoiceUrl costuma resolver tudo
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
