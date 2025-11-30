import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  inviteToken: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received email request');
    
    const { to, inviteToken, role }: EmailRequest = await req.json();
    console.log('Sending invitation to:', to, 'Role:', role);

    if (!to || !inviteToken || !role) {
      throw new Error('Missing required fields: to, inviteToken, role');
    }

    // Get Gmail credentials from environment
    const gmailEmail = Deno.env.get('GMAIL_EMAIL');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailEmail || !gmailPassword) {
      throw new Error('Gmail credentials not configured');
    }

    // Get app URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const appUrl = supabaseUrl.replace('supabase.co', 'lovable.app');

    // Translate role to Portuguese
    const roleNames: Record<string, string> = {
      direcao: 'Direção',
      coordenacao: 'Coordenação',
      professor: 'Professor',
    };
    const roleName = roleNames[role] || role;

    // Create email content
    const subject = 'Convite para Neo Missio - Sistema de Gestão';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .token { background: #fff; padding: 15px; border: 2px dashed #667eea; border-radius: 4px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; word-break: break-all; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Convite Neo Missio</h1>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Você foi convidado para se cadastrar no sistema Neo Missio como <strong>${roleName}</strong>.</p>
              
              <p>Use o token abaixo para completar seu cadastro:</p>
              <div class="token">${inviteToken}</div>
              
              <p>Para se cadastrar:</p>
              <ol>
                <li>Acesse a página de cadastro</li>
                <li>Clique em "Tenho um convite"</li>
                <li>Insira este token quando solicitado</li>
                <li>Complete seu cadastro</li>
              </ol>
              
              <center>
                <a href="${appUrl}" class="button">Acessar Sistema</a>
              </center>
              
              <p class="footer">
                Este convite expira em 7 dias.<br>
                Se você não solicitou este convite, pode ignorar este email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Convite Neo Missio

Você foi convidado para se cadastrar no sistema Neo Missio como ${roleName}.

Token de Convite: ${inviteToken}

Para se cadastrar:
1. Acesse: ${appUrl}
2. Clique em "Tenho um convite"
3. Insira o token acima
4. Complete seu cadastro

Este convite expira em 7 dias.
    `;

    // Send email using Gmail SMTP
    console.log('Sending email via Gmail SMTP...');
    
    // Use a library to send email via SMTP
    // Note: Deno doesn't have a built-in SMTP client, so we'll use a fetch-based approach
    // with Gmail API or a service like smtpjs.com
    
    // For simplicity, we'll use a basic approach with nodemailer-like implementation
    // In production, consider using a proper SMTP library
    
    const emailData = {
      from: gmailEmail,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    // Create SMTP connection
    const smtpHost = 'smtp.gmail.com';
    const smtpPort = 587;

    // Use Deno's TCP connection
    const conn = await Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper to read from connection
    async function readLine(): Promise<string> {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      if (n === null) return '';
      return decoder.decode(buffer.subarray(0, n));
    }

    // Helper to write to connection
    async function writeLine(data: string): Promise<void> {
      await conn.write(encoder.encode(data + '\r\n'));
    }

    try {
      // SMTP conversation
      console.log('Starting SMTP conversation...');
      
      // Read greeting
      let response = await readLine();
      console.log('Server:', response);

      // Send EHLO
      await writeLine(`EHLO ${smtpHost}`);
      response = await readLine();
      console.log('EHLO response:', response);

      // Start TLS
      await writeLine('STARTTLS');
      response = await readLine();
      console.log('STARTTLS response:', response);

      // Upgrade to TLS
      const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });

      // Continue with TLS connection
      async function readLineTls(): Promise<string> {
        const buffer = new Uint8Array(1024);
        const n = await tlsConn.read(buffer);
        if (n === null) return '';
        return decoder.decode(buffer.subarray(0, n));
      }

      async function writeLineTls(data: string): Promise<void> {
        await tlsConn.write(encoder.encode(data + '\r\n'));
      }

      // Send EHLO again after TLS
      await writeLineTls(`EHLO ${smtpHost}`);
      response = await readLineTls();
      console.log('EHLO TLS response:', response);

      // Authenticate
      await writeLineTls('AUTH LOGIN');
      response = await readLineTls();
      console.log('AUTH LOGIN response:', response);

      // Send username (base64 encoded)
      const usernameBase64 = btoa(gmailEmail);
      await writeLineTls(usernameBase64);
      response = await readLineTls();
      console.log('Username response:', response);

      // Send password (base64 encoded)
      const passwordBase64 = btoa(gmailPassword);
      await writeLineTls(passwordBase64);
      response = await readLineTls();
      console.log('Password response:', response);

      // Send MAIL FROM
      await writeLineTls(`MAIL FROM:<${gmailEmail}>`);
      response = await readLineTls();
      console.log('MAIL FROM response:', response);

      // Send RCPT TO
      await writeLineTls(`RCPT TO:<${to}>`);
      response = await readLineTls();
      console.log('RCPT TO response:', response);

      // Send DATA
      await writeLineTls('DATA');
      response = await readLineTls();
      console.log('DATA response:', response);

      // Send email headers and body
      await writeLineTls(`From: ${gmailEmail}`);
      await writeLineTls(`To: ${to}`);
      await writeLineTls(`Subject: ${subject}`);
      await writeLineTls('MIME-Version: 1.0');
      await writeLineTls('Content-Type: text/html; charset=utf-8');
      await writeLineTls('');
      await writeLineTls(htmlContent);
      await writeLineTls('.');
      response = await readLineTls();
      console.log('Email sent response:', response);

      // Send QUIT
      await writeLineTls('QUIT');
      response = await readLineTls();
      console.log('QUIT response:', response);

      tlsConn.close();

      console.log('Email sent successfully to:', to);

      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } catch (smtpError) {
      console.error('SMTP error:', smtpError);
      conn.close();
      throw smtpError;
    }

  } catch (error: any) {
    console.error('Error in send-invitation-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
