const { createClient } = require('@supabase/supabase-js');

// SUPABASE CONFIG
const SUPABASE_URL = 'https://ssnmuiskarajydbtwgto.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1lU6cvC-IYkakkNz4Mi3WAJy4cXBY85nn/export?format=csv';

function parseCSV(data) {
  const lines = data.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = (values[index] || '').replace(/^"|"$/g, '');
    });
    results.push(obj);
  }
  return results;
}

async function importData() {
  console.log('--- RESUMINDO IMPORTAÇÃO DE LEGADOS ---');
  
  let csvText;
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    csvText = await res.text();
  } catch (err) {
    console.error('Erro ao baixar CSV:', err.message);
    return;
  }

  const records = parseCSV(csvText);
  console.log(`Linhas totais na planilha: ${records.length}`);

  // Fetch current state for deduplication
  const { data: existingAlunos } = await supabase.from('alunos').select('nome_completo');
  const existingAlunosSet = new Set(existingAlunos.map(a => a.nome_completo.toLowerCase().trim()));

  const { data: existingProfiles } = await supabase.from('profiles').select('email, id');
  const profileMap = new Map(existingProfiles.map(p => [p.email.toLowerCase().trim(), p.id]));

  let createdUsers = 0;
  let createdAlunos = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of records) {
    try {
      const nome = row['Nome (nome do participante)'] || '';
      const sobrenome = row['Sobrenome'] || '';
      const nomeCompleto = `${nome.trim()} ${sobrenome.trim()}`.trim();
      
      if (!nomeCompleto || nomeCompleto.toLowerCase().includes('cancelada')) {
        skipped++;
        continue;
      }

      if (existingAlunosSet.has(nomeCompleto.toLowerCase())) {
        skipped++;
        continue;
      }

      const email = (row['Email Address'] || row['email'] || '').toLowerCase().trim();
      const responsavelNome = (row['Qual o nome do responsável?'] || row['Se menor de 18 anos, inserir o nome do Responsável:'] || 'Responsável Legado').trim();
      const idadeStr = row['Idade'] || row['Qual a idade?'] || '0';
      const idade = parseInt(idadeStr.replace(/[^0-9]/g, '')) || 10;
      
      // FIX: Robust CPF Formatting (Match DB constraint: exactly 11 digits or null)
      const rawCpf = row['CPF (ou do responsável)'] || '';
      const cleanCpf = rawCpf.replace(/[^0-9]/g, '');
      const finalCpf = (cleanCpf.length === 11) ? cleanCpf : null;

      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - idade;
      const dataNascimento = `${birthYear}-01-01`;

      let responsavelId;

      if (email && email.includes('@')) {
        if (profileMap.has(email)) {
          responsavelId = profileMap.get(email);
        } else {
          try {
            const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
              email: email,
              password: Math.random().toString(36).slice(-12),
              email_confirm: true,
              user_metadata: { nome_completo: responsavelNome }
            });

            if (userError) {
              if (userError.message.includes('already registered')) {
                // If user exists in Auth but not locally cached, try to find their ID
                const { data: searchUser } = await supabase.from('profiles').select('id').eq('email', email).single();
                if (searchUser) {
                  responsavelId = searchUser.id;
                } else {
                  skipped++; // Should not happen with admin create but to be safe
                  continue;
                }
              } else {
                errors++;
                continue;
              }
            } else {
              responsavelId = newUser.user.id;
              createdUsers++;
              await supabase.from('user_roles').insert({ user_id: responsavelId, role: 'responsavel' });
            }
            profileMap.set(email, responsavelId);
          } catch (ue) {
            errors++;
            continue;
          }
        }
      } else {
        skipped++;
        continue;
      }

      const { error: alunoError } = await supabase.from('alunos').insert({
        nome_completo: nomeCompleto,
        data_nascimento: dataNascimento,
        responsavel_id: responsavelId,
        cpf: finalCpf,
        telefone: row['WhatsApp ou telefone: (Se for menor de 18, inserir o contato do responsável)'] || null
      });

      if (alunoError) {
        if (!alunoError.message.includes('duplicate key')) {
          console.error(`Erro ao criar aluno ${nomeCompleto}:`, alunoError.message);
          errors++;
        } else {
          skipped++;
        }
      } else {
        existingAlunosSet.add(nomeCompleto.toLowerCase());
        createdAlunos++;
      }

    } catch (e) {
      console.error('Erro inesperado na linha:', e.message);
      errors++;
    }
  }

  console.log('--- RELATÓRIO FINAL (V3) ---');
  console.log(`Novos Usuários criados: ${createdUsers}`);
  console.log(`Novos Alunos criados: ${createdAlunos}`);
  console.log(`Total Ignorados/Duplicados: ${skipped}`);
  console.log(`Erros finais: ${errors}`);
}

importData();
