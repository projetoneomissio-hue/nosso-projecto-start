export const WELCOME_EMAIL_TEMPLATE = (nomeResponsavel: string, nomeAluno: string) => `

export const MATRICULA_APROVADA_TEMPLATE = (nomeResponsavel: string, nomeAluno: string, atividade: string) => `
  < !DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8" >
      <style>
      body { font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans - serif; line - height: 1.6; color: #333; }
    .container { max - width: 600px; margin: 0 auto; padding: 20px; }
    .header { background - color: #f8fafc; padding: 30px; text - align: center; border - radius: 12px 12px 0 0; }
    .logo { color: #0f172a; font - size: 24px; font - weight: bold; text - decoration: none; }
    .content { background - color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border - top: none; border - radius: 0 0 12px 12px; }
    .button { display: inline - block; background - color: #0f172a; color: white; padding: 12px 24px; text - decoration: none; border - radius: 6px; font - weight: bold; margin - top: 20px; }
    .footer { text - align: center; padding: 20px; color: #64748b; font - size: 12px; margin - top: 20px; }
    .highlight { color: #0f172a; font - weight: bold; }
    .box { background - color: #f8fafc; border: 1px solid #e2e8f0; border - radius: 8px; padding: 15px; margin: 20px 0; }
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <div class="logo" > NeoMissio </div>
        </div>
        < div class="content" >
          <h2>Matrícula Aprovada! 🎉</h2>

            < p > Olá, <strong>${ nomeResponsavel } </strong>!</p >
              <p>Seja bem - vindo(a) ao Centro Social Neo Missio! É uma satisfação receber você e o(a) aluno(a) < span class="highlight" > ${ nomeAluno } </span> em nossas atividades de <span class="highlight">${atividade}</span >.</p>

                < p > Desejamos que este seja um período de aprendizado, convivência e crescimento para todos.</p>

                  < div class="box" >
                    <h3 style="margin-top: 0; color: #0f172a;" >📅 Informações importantes: </h3>
                      < ul style = "margin-bottom: 0;" >
                        <li>A taxa de matrícula é de < strong > R$ 25,00 < /strong> (pagamento único referente à inscrição).</li >
                          <li>O vencimento da mensalidade é todo < strong > dia 10 < /strong> de cada mês. O comprovante deve ser encaminhado para a secretaria.</li >
                            </ul>
                            </div>

                            < div class="box" >
                              <h3 style="margin-top: 0; color: #0f172a;" >🤝 Compromisso e responsabilidade: </h3>
                                < p style = "margin-bottom: 0;" > Contamos com o compromisso de participação regular nas atividades, respeitando horários, normas e orientações do Centro Social.</p>
                                  < p style = "margin-bottom: 0;" > Reforçamos também que < strong > não é permitido permanecer ou deixar crianças desacompanhadas < /strong> em nossos espaços, sendo essa uma medida de segurança e cuidado com todos.</p >
                                    </div>

                                    < div class="box" >
                                      <h3 style="margin-top: 0; color: #0f172a;" >📲 Comunicação: </h3>
                                        < p style = "margin-bottom: 0;" > Solicite ao professor ou ao coordenador da atividade a inclusão no grupo de WhatsApp, onde são compartilhadas informações importantes sobre as aulas.</ p >
                                          </div>

                                          < div style = "text-align: center;" >
                                            <a href="https://neomissio.com/login" class="button" > Acessar Portal do Responsável </a>
                                              </div>

                                              < p style = "margin-top: 30px;" > Nos siga no Instagram para ficar por dentro das novidades: <a href="https://instagram.com/neomissiocuritiba" style = "color:#0f172a; font-weight:bold;" > @neomissiocuritiba < /a></p >
                                                <p>Estamos à disposição para qualquer dúvida e desejamos um excelente início de atividades! </p>

                                                  < p > Atenciosamente, <br><strong>Equipe NeoMissio < /strong></p >
                                                    </div>
                                                    < div class="footer" >
                                                      <p>© ${ new Date().getFullYear() } NeoMissio.Todos os direitos reservados.</p>
                                                        </div>
                                                        </div>
                                                        </body>
                                                        </html>
                                                          `;

export const MATRICULA_SOLICITADA_TEMPLATE = (nomeResponsavel: string, nomeAluno: string, atividade: string) => `
                                                        < !DOCTYPE html >
                                                          <html>
                                                          <head>
                                                          <meta charset="utf-8" >
                                                            <style>
                                                            body { font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans - serif; line - height: 1.6; color: #333; }
    .container { max - width: 600px; margin: 0 auto; padding: 20px; }
    .header { background - color: #f8fafc; padding: 30px; text - align: center; border - radius: 12px 12px 0 0; }
    .logo { color: #0f172a; font - size: 24px; font - weight: bold; text - decoration: none; }
    .content { background - color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border - top: none; border - radius: 0 0 12px 12px; }
    .footer { text - align: center; padding: 20px; color: #64748b; font - size: 12px; margin - top: 20px; }
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <div class="logo" > NeoMissio </div>
        </div>
        < div class="content" >
          <h2>Pedido de Matrícula Recebido! 📝</h2>

            < p > Olá, <strong>${ nomeResponsavel } </strong>!</p >
              <p>Recebemos o pedido de matrícula do (a) aluno(a) < strong > ${ nomeAluno } </strong> para a atividade de <strong>${atividade}</strong >.</p>

                < p > Sua solicitação está na fila de avaliação da nossa Direção, que verificará a disponibilidade de vagas e as documentações.</ p >
                  <p><strong>Aguarde! < /strong> Em breve você receberá um novo aviso assim que a matrícula for aprovada, contendo as instruções financeiras e os próximos passos.</p >

                  <p>Atenciosamente, <br><strong>Equipe NeoMissio < /strong></p >
                    </div>
                    < div class="footer" >
                      <p>© ${ new Date().getFullYear() } NeoMissio.</p>
                        </div>
                        </div>
                        </body>
                        </html>
                          `;

export const NOVA_MATRICULA_ADMIN_TEMPLATE = (nomeAluno: string, atividade: string, unidade?: string) => `
                        < !DOCTYPE html >
                          <html>
                          <head>
                          <meta charset="utf-8" >
                            <style>
                            body { font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans - serif; line - height: 1.6; color: #333; }
    .container { max - width: 600px; margin: 0 auto; padding: 20px; }
    .header { background - color: #fffbeb; padding: 20px; text - align: center; border - radius: 12px 12px 0 0; border - bottom: 3px solid #fbbf24; }
    .title { color: #d97706; font - size: 18px; font - weight: bold; margin: 0; }
    .content { background - color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border - top: none; border - radius: 0 0 12px 12px; }
    .button { display: inline - block; background - color: #d97706; color: white; padding: 10px 20px; text - decoration: none; border - radius: 6px; font - weight: bold; margin - top: 15px; }
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <p class="title" > Aviso de Nova Matrícula Pendente </p>
        </div>
        < div class="content" >
          <p>Olá, Direção! </p>
          < p > Uma nova solicitação de matrícula acabou de ser efetuada no portal externo.</p>

            < ul style = "background: #f8fafc; padding: 15px 30px; border-radius: 8px; margin: 20px 0;" >
              <li><strong>Aluno: </strong> ${nomeAluno}</li >
                <li><strong>Atividade Solicitada: </strong> ${atividade}</li >
                  ${ unidade ? `<li><strong>Unidade:</strong> ${unidade}</li>` : '' }
</ul>

  < p > Acesse o painel do sistema para revisar, alocar a turma correta e aprovar o aluno.</p>

    < div style = "text-align: center;" >
      <a href="https://neomissio.com/login" class="button" > Acessar Painel </a>
        </div>
        </div>
        </div>
        </body>
        </html>
          `;

export const WELCOME_EMAIL_TEMPLATE = (nomeResponsavel: string, nomeAluno: string) => `
        < meta charset = "utf-8" >
          <style>
          body { font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans - serif; line - height: 1.6; color: #333; }
    .container { max - width: 600px; margin: 0 auto; padding: 20px; }
    .header { background - color: #f8fafc; padding: 30px; text - align: center; border - radius: 12px 12px 0 0; }
    .logo { color: #0f172a; font - size: 24px; font - weight: bold; text - decoration: none; }
    .content { background - color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border - top: none; border - radius: 0 0 12px 12px; }
    .button { display: inline - block; background - color: #0bdc5f; color: white; padding: 12px 24px; text - decoration: none; border - radius: 6px; font - weight: bold; margin - top: 20px; }
    .footer { text - align: center; padding: 20px; color: #64748b; font - size: 12px; margin - top: 20px; }
    .highlight { color: #0bdc5f; font - weight: bold; }
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <div class="logo" > NeoMissio </div>
        </div>
        < div class="content" >
          <h2>Bem - vindo(a), ${ nomeResponsavel } ! 👋</h2>

            < p > Estamos muito felizes em ter você e o(a) aluno(a) < span class="highlight" > ${ nomeAluno } </span> conosco.</p >

              <p>O cadastro foi realizado com sucesso.Agora você pode acessar o portal para: </p>

                < ul >
                <li>Acompanhar a frequência </li>
                  < li > Visualizar atividades e horários </li>
                    < li > Gerenciar pagamentos e mensalidades </li>
                      </ul>

                      < div style = "text-align: center;" >
                        <a href="https://neomissio.com/login" class="button" > Acessar Portal do Responsável </a>
                          </div>

                          < p style = "margin-top: 30px;" > Se tiver qualquer dúvida, nossa equipe de coordenação está à disposição.</p>

                            < p > Atenciosamente, <br><strong>Equipe NeoMissio < /strong></p >
                              </div>
                              < div class="footer" >
                                <p>© ${ new Date().getFullYear() } NeoMissio.Todos os direitos reservados.</p>
                                  < p > Este é um email automático, por favor não responda.</p>
                                    </div>
                                    </div>
                                    </body>
                                    </html>
                                      `;

export const PAYMENT_REMINDER_TEMPLATE = (
  nomeResponsavel: string,
  nomeAluno: string,
  atividade: string,
  valor: number,
  diasAtraso: number,
  linkPagamento?: string
) => `
                                    < !DOCTYPE html >
                                      <html>
                                      <head>
                                      <meta charset="utf-8" >
                                        <style>
                                        body { font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans - serif; line - height: 1.6; color: #333; }
    .container { max - width: 600px; margin: 0 auto; padding: 20px; }
    .header { background - color: #fff1f2; padding: 30px; text - align: center; border - radius: 12px 12px 0 0; border - bottom: 3px solid #e11d48; }
    .logo { color: #be123c; font - size: 24px; font - weight: bold; text - decoration: none; }
    .content { background - color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border - top: none; border - radius: 0 0 12px 12px; }
    .alert - box { background - color: #fff1f2; border - left: 4px solid #e11d48; padding: 15px; margin: 20px 0; color: #be123c; }
    .details { background - color: #f8fafc; padding: 20px; border - radius: 8px; margin: 20px 0; }
    .detail - row { display: flex; justify - content: space - between; margin - bottom: 10px; border - bottom: 1px dashed #cbd5e1; padding - bottom: 5px; }
    .detail - row: last - child { border - bottom: none; margin - bottom: 0; padding - bottom: 0; }
    .button { display: inline - block; background - color: #e11d48; color: white; padding: 12px 24px; text - decoration: none; border - radius: 6px; font - weight: bold; margin - top: 20px; }
    .footer { text - align: center; padding: 20px; color: #64748b; font - size: 12px; margin - top: 20px; }
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <div class="logo" > NeoMissio </div>
        < p style = "margin: 5px 0 0; color: #be123c; font-weight: 500;" > Lembrete de Mensalidade </p>
          </div>
          < div class="content" >
            <p>Olá, <strong>${ nomeResponsavel } </strong>,</p >

              <div class="alert-box" >
                <strong>Atenção: </strong> Identificamos um pagamento pendente com <strong>${diasAtraso} dias de atraso</strong >.
      </div>

                  < p > Referente à matrícula de < strong > ${ nomeAluno } </strong> na atividade <strong>${atividade}</strong >.</p>

                    < div class="details" >
                      <div class="detail-row" >
                        <span>Aluno: </span>
                          < strong > ${ nomeAluno } </strong>
                            </div>
                            < div class="detail-row" >
                              <span>Atividade: </span>
                                < strong > ${ atividade } </strong>
                                  </div>
                                  < div class="detail-row" >
                                    <span>Valor: </span>
                                      < strong > R$ ${ valor.toFixed(2).replace('.', ',') } </strong>
                                        </div>
                                        </div>

                                        < p > Para evitar bloqueio no acesso às aulas, solicitamos que regularize a situação o quanto antes.</p>
      
      ${
  linkPagamento ? `
      <div style="text-align: center;">
        <a href="${linkPagamento}" class="button">Realizar Pagamento Agora</a>
      </div>
      ` : ''
}

<p style="margin-top: 30px; font-size: 14px; color: #64748b;" > Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.</p>

  < p > Atenciosamente, <br><strong>Equipe Financeira NeoMissio < /strong></p >
    </div>
    < div class="footer" >
      <p>© ${ new Date().getFullYear() } NeoMissio.</p>
        </div>
        </div>
        </body>
        </html>
          `;

export const PAYMENT_DUE_TODAY_TEMPLATE = (
  nomeResponsavel: string,
  nomeAluno: string,
  atividade: string,
  valor: number,
  linkPagamento?: string
) => `
        < !DOCTYPE html >
          <html>
          <head>
          <meta charset="utf-8" >
            <style>
            body { font - family: 'Segoe UI', Tahoma, Geneva, Verdana, sans - serif; line - height: 1.6; color: #333; }
    .container { max - width: 600px; margin: 0 auto; padding: 20px; }
    .header { background - color: #f0fdf4; padding: 30px; text - align: center; border - radius: 12px 12px 0 0; border - bottom: 3px solid #16a34a; }
    .logo { color: #15803d; font - size: 24px; font - weight: bold; text - decoration: none; }
    .content { background - color: #ffffff; padding: 40px; border: 1px solid #e2e8f0; border - top: none; border - radius: 0 0 12px 12px; }
    .info - box { background - color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; margin: 20px 0; color: #166534; border - radius: 6px; }
    .details { background - color: #f8fafc; padding: 20px; border - radius: 8px; margin: 20px 0; }
    .detail - row { display: flex; justify - content: space - between; margin - bottom: 10px; border - bottom: 1px dashed #cbd5e1; padding - bottom: 5px; }
    .detail - row: last - child { border - bottom: none; margin - bottom: 0; padding - bottom: 0; }
    .button { display: inline - block; background - color: #16a34a; color: white; padding: 12px 24px; text - decoration: none; border - radius: 6px; font - weight: bold; margin - top: 20px; }
    .footer { text - align: center; padding: 20px; color: #64748b; font - size: 12px; margin - top: 20px; }
</style>
  </head>
  < body >
  <div class="container" >
    <div class="header" >
      <div class="logo" > NeoMissio </div>
        < p style = "margin: 5px 0 0; color: #15803d; font-weight: 500;" > Lembrete de Vencimento </p>
          </div>
          < div class="content" >
            <p>Olá, <strong>${ nomeResponsavel } </strong>,</p >

              <div class="info-box" >
                Lembramos que a mensalidade de < strong > ${ nomeAluno } </strong> vence <strong>hoje</strong >.
      </div>

                  < div class="details" >
                    <div class="detail-row" >
                      <span>Atividade: </span>
                        < strong > ${ atividade } </strong>
                          </div>
                          < div class="detail-row" >
                            <span>Valor: </span>
                              < strong > R$ ${ valor.toFixed(2).replace('.', ',') } </strong>
                                </div>
                                </div>

                                < p > Mantenha as mensalidades em dia para garantir o acesso contínuo às atividades.</p>
      
      ${
  linkPagamento ? `
      <div style="text-align: center;">
        <a href="${linkPagamento}" class="button">Pagar Agora</a>
      </div>
      ` : ''
}

<p style="margin-top: 30px; font-size: 14px; color: #64748b;" > Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.</p>

  < p > Atenciosamente, <br><strong>Equipe Financeira NeoMissio < /strong></p >
    </div>
    < div class="footer" >
      <p>© ${ new Date().getFullYear() } NeoMissio.</p>
        </div>
        </div>
        </body>
        </html>
          `;
