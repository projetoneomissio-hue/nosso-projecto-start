
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAtividade() {
    console.log("=== CHECKING ATIVIDADE STATUS ===\n");

    const atividadeId = '038c3c0e-d0bb-480f-a556-b0c402df3539'; // Jiu-Jitsu

    const { data: atividade, error } = await supabase
        .from('atividades')
        .select('*')
        .eq('id', atividadeId)
        .single();

    if (error) {
        console.error("Error fetching atividade:", error);
    } else {
        console.log("Atividade 'Jiu-Jitsu':");
        console.log(JSON.stringify(atividade, null, 2));
    }
}

checkAtividade();
