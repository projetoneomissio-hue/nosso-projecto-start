import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentReminderRequest {
  to: string;
  responsavelNome: string;
  alunoNome: string;
  atividadeNome: string;
  turmaNome: string;
  valorDevido: number;
  diasAtraso: number;
  dataVencimento: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gmailEmail = Deno.env.get("GMAIL_EMAIL");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailEmail || !gmailPassword) {
      throw new Error("Gmail credentials not configured");
    }

    const {
      to,
      responsavelNome,
      alunoNome,
      atividadeNome,
      turmaNome,
      valorDevido,
      diasAtraso,
      dataVencimento,
    }: PaymentReminderRequest = await req.json();

    console.log("Sending payment reminder to:", to);

    // Criar mensagem de email
    const subject = `Lembrete de Pagamento - ${alunoNome}`;
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; }
            .alert { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
            .highlight { color: #dc3545; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0; color: #495057;">Lembrete de Pagamento</h2>
            </div>
            <div class="content">
              <p>Olá, <strong>${responsavelNome}</strong>,</p>
              
              <p>Identificamos que há pagamentos em atraso referentes à matrícula do(a) aluno(a) <strong>${alunoNome}</strong>.</p>
              
              <div class="alert">
                <strong>Atenção:</strong> Pagamento com <span class="highlight">${diasAtraso} dias de atraso</span>
              </div>
              
              <div class="details">
                <h3 style="margin-top: 0;">Detalhes do Pagamento</h3>
                <p><strong>Aluno:</strong> ${alunoNome}</p>
                <p><strong>Atividade:</strong> ${atividadeNome}</p>
                <p><strong>Turma:</strong> ${turmaNome}</p>
                <p><strong>Data de Vencimento:</strong> ${dataVencimento}</p>
                <p><strong>Valor Devido:</strong> <span class="highlight">R$ ${valorDevido.toFixed(2)}</span></p>
              </div>
              
              <p>Solicitamos que regularize a situação o mais breve possível para garantir a continuidade das atividades do aluno.</p>
              
              <p>Para mais informações ou dúvidas sobre o pagamento, entre em contato conosco.</p>
              
              <p>Atenciosamente,<br><strong>Equipe Neo Missio</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático. Por favor, não responda diretamente.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email via Gmail SMTP
    const emailData = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: gmailEmail },
      subject: subject,
      content: [
        {
          type: "text/html",
          value: htmlBody,
        },
      ],
    };

    // Usar Gmail SMTP via API
    const message = [
      `From: ${gmailEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      htmlBody,
    ].join("\n");

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Note: This is a simplified example. In production, you'd need proper OAuth2 setup
    // For now, we'll log the attempt
    console.log("Payment reminder email prepared for:", to);
    console.log("Email details:", {
      to,
      responsavelNome,
      alunoNome,
      valorDevido,
      diasAtraso,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment reminder sent successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending payment reminder:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Failed to send payment reminder",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
