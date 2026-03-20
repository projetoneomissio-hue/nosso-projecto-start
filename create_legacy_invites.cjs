const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// SUPABASE CONFIG
const SUPABASE_URL = 'https://ssnmuiskarajydbtwgto.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function generateToken() {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 random chars
}

async function createInvites() {
  console.log('--- GERANDO TOKENS DE CONVITE PARA PAIS LEGADOS ---');
  
  const twelveHoursAgo = new Date(Date.now() - (12 * 3600000)).toISOString();
  
  // 1. Get legacy profiles
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('email, id')
    .gt('created_at', twelveHoursAgo)
    .not('email', 'eq', 'pendente@neomissio.com.br')
    .not('nome_completo', 'ilike', 'LEGADO - Pendente%');

  if (pError) {
    console.error('Erro ao buscar perfis:', pError.message);
    return;
  }

  console.log(`Encontrados ${profiles.length} perfis para gerar convite.`);

  const expires_at = new Date(Date.now() + (30 * 24 * 3600000)).toISOString(); // 30 days
  
  let count = 0;
  for (const profile of profiles) {
    const token = generateToken();
    
    // Check if invitation already exists
    const { data: existing } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', profile.email)
      .single();

    if (existing) {
       console.log(`Convite já existe para ${profile.email}. Pulando.`);
       continue;
    }

    const { error: iError } = await supabase
      .from('invitations')
      .insert({
        email: profile.email,
        role: 'responsavel',
        token: token,
        expires_at: expires_at,
        created_by: '38f3c776-5c3b-4eae-b49f-c8dbe442c212' // Valid Direção ID
      });

    if (iError) {
      console.error(`Erro ao criar convite para ${profile.email}:`, iError.message);
    } else {
      count++;
    }
  }

  console.log(`Total de convites criados: ${count}`);
}

createInvites();
