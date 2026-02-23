
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspectProfessor() {
    console.log("=== INSPECTING PROFESSOR RECORD ===\n");

    const userId = 'd48f749a-f6d4-44d3-b68a-681fa8a615a3';

    const { data: professor, error } = await supabase
        .from('professores')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error("Error fetching professor:", error);
    } else {
        console.log("Professor Record:");
        console.log(JSON.stringify(professor, null, 2));
    }
}

inspectProfessor();
