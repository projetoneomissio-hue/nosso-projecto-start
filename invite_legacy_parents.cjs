const { createClient } = require('@supabase/supabase-js');

// SUPABASE CONFIG
const SUPABASE_URL = 'https://ssnmuiskarajydbtwgto.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DRY_RUN = true; // Set to true to test without sending
const DELAY_MS = 1000; // 1 second between invitations

async function inviteParents() {
  console.log('--- INICIANDO DISPARO DE CONVITES LEGADOS ---');
  
  // 1. Fetch profiles that look like legacy (created recently or matching our import pattern)
  const twelveHoursAgo = new Date(Date.now() - (12 * 3600000)).toISOString();
  
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('email, nome_completo')
    .gt('created_at', twelveHoursAgo)
    .not('email', 'eq', 'pendente@neomissio.com.br')
    .not('nome_completo', 'ilike', 'LEGADO - Pendente%');

  if (pError) {
    console.error('Erro ao buscar perfis:', pError.message);
    return;
  }

  console.log(`Encontrados ${profiles.length} perfis para convidar.`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const profile of profiles) {
    const email = profile.email;
    
    if (DRY_RUN) {
      console.log(`[DRY-RUN] Convidando: ${email} (${profile.nome_completo})`);
      success++;
      continue;
    }

    console.log(`Enviando convite para: ${email}...`);
    
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
       redirectTo: 'https://sistema.neomissio.com.br/login'
    });

    if (inviteError) {
      console.error(`Falha ao convidar ${email}:`, inviteError.message);
      failed++;
    } else {
      success++;
    }

    // Wait to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  console.log('--- RELATÓRIO DE CONVITES ---');
  console.log(`Sucesso: ${success}`);
  console.log(`Falha: ${failed}`);
  console.log(`Ignorados: ${skipped}`);
}

inviteParents();
