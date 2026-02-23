
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkEnrollments() {
    console.log("=== CHECKING ENROLLMENTS ===\n");

    const turmaId = '29bbbdef-d4e6-45ac-807d-74b126abd557'; // Jiu-Jitsu Adulto

    const { data: matriculas, error } = await supabase
        .from('matriculas')
        .select(`
            id,
            aluno_id,
            status,
            alunos(nome_completo)
        `)
        .eq('turma_id', turmaId);

    if (error) {
        console.error("Error fetching matriculas:", error);
    } else {
        console.log(`Total enrollments for the class: ${matriculas.length}`);
        console.log(JSON.stringify(matriculas, null, 2));
    }
}

checkEnrollments();
