const { createClient } = require('@supabase/supabase-js');

// SUPABASE CONFIG
const SUPABASE_URL = 'https://ssnmuiskarajydbtwgto.supabase.co';
// Using the service role key from previous scripts
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1lU6cvC-IYkakkNz4Mi3WAJy4cXBY85nn/export?format=csv';

function parseCSV(data) {
  const lines = data.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parser for quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else current += char;
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

async function mapStudents() {
  console.log('--- INICIANDO MAPEAMENTO DE ESTUDANTES PARA CONVITES ---');

  // 1. Baixar Planilha
  const res = await fetch(CSV_URL);
  const csvText = await res.text();
  const records = parseCSV(csvText);
  console.log(`Linhas na planilha: ${records.length}`);

  // 2. Buscar Alunos Atuais (para pegar IDs)
  const { data: students, error: sError } = await supabase
    .from('alunos')
    .select('id, nome_completo');
  
  if (sError) throw sError;
  const studentMap = new Map();
  students.forEach(s => {
    studentMap.set(s.nome_completo.toLowerCase().trim(), s.id);
  });

  // 3. Agrupar Alunos por Email de Responsável
  const emailToStudentIds = new Map();
  
  for (const row of records) {
    const nome = row['Nome (nome do participante)'] || '';
    const sobrenome = row['Sobrenome'] || '';
    const nomeCompleto = `${nome.trim()} ${sobrenome.trim()}`.trim();
    const email = (row['Email Address'] || row['email'] || '').toLowerCase().trim();

    if (!nomeCompleto || !email || email === 'pendente@neomissio.com.br') continue;

    const studentId = studentMap.get(nomeCompleto.toLowerCase());
    if (studentId) {
      if (!emailToStudentIds.has(email)) emailToStudentIds.set(email, []);
      emailToStudentIds.get(email).push(studentId);
    }
  }

  console.log(`Mapeamento concluído: ${emailToStudentIds.size} e-mails únicos com alunos encontrados.`);

  // 4. Atualizar Invitations.metadata
  let updatedCount = 0;
  for (const [email, studentIds] of emailToStudentIds.entries()) {
    const { data: invite, error: iError } = await supabase
      .from('invitations')
      .select('id, metadata')
      .eq('email', email)
      .maybeSingle();

    if (invite && !iError) {
      const metadata = { ...(invite.metadata || {}), existing_student_ids: studentIds };
      
      const { error: uError } = await supabase
        .from('invitations')
        .update({ metadata })
        .eq('id', invite.id);
      
      if (!uError) updatedCount++;
    }
  }

  console.log(`--- SUCESSO: ${updatedCount} convites atualizados com IDs de alunos. ---`);
}

mapStudents().catch(console.error);
