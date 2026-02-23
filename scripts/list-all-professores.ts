
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listAllProfessors() {
    console.log("=== LISTING ALL PROFESSORS ===\n");

    const { data: professors, error } = await supabase
        .from('professores')
        .select('*');

    if (error) {
        console.error("Error fetching professors:", error);
    } else {
        console.log(`Total professors: ${professors.length}`);
        console.log(JSON.stringify(professors, null, 2));
    }
}

listAllProfessors();
