const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ssnmuiskarajydbtwgto.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY'
);

const spreadsheet2026 = [
  "Vitor Hugo Silva Rodrigues paz", "Enzo luiz Pszysiezny bezerra", "Ana Luíza Pszysiezny bezerra",
  "Miyuki Tamaru Silva Grosskopf", "Maísa Elias Padilha ribeiro", "Lúcia mara Moreira",
  "Daniela Siqueira Campos Bahiense Rodrigues", "Eduardo Porochniak Silveira", "Sara Ramos de Oliveira",
  "Abner Lourenço", "Carolina Regina Mendes de Oliveira", "Vinicius Vieira Assumpcão", "Augusto Vallim eing"
];

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

async function runReport() {
  const { data: dbAlunos, error } = await supabase.from('alunos').select('nome_completo');
  if (error) { console.error(error); process.exit(1); }

  const report = {
    exact: [],
    partial: [],
    notFound: []
  };

  spreadsheet2026.forEach(sName => {
    const sNorm = normalize(sName);
    let found = false;

    dbAlunos.forEach(db => {
      const dbNorm = normalize(db.nome_completo);
      if (sNorm === dbNorm) {
        report.exact.push({ spreadsheet: sName, db: db.nome_completo });
        found = true;
      } else if (sNorm.includes(dbNorm) || dbNorm.includes(sNorm)) {
        report.partial.push({ spreadsheet: sName, db: db.nome_completo });
        found = true;
      } else {
        // Splitting into words to see if we have same first + last
        const sWords = sNorm.split(' ');
        const dbWords = dbNorm.split(' ');
        if (sWords[0] === dbWords[0] && sWords[sWords.length-1] === dbWords[dbWords.length-1] && sWords.length > 1) {
            report.partial.push({ spreadsheet: sName, db: db.nome_completo, type: 'first_last_match' });
            found = true;
        }
      }
    });

    if (!found) {
      report.notFound.push(sName);
    }
  });

  process.stdout.write(JSON.stringify(report));
}

runReport();
