
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTurmaStatus() {
    console.log("=== CHECKING TURMA STATUS AND POLICIES ===\n");

    const { data: professor } = await supabase
        .from('professores')
        .select('id')
        .eq('user_id', 'd48f749a-f6d4-44d3-b68a-681fa8a615a3')
        .single();

    if (!professor) {
        console.log("No professor found for user_id d48f749a-f6d4-44d3-b68a-681fa8a615a3");
        return;
    }

    console.log(`Found Professor record ID: ${professor.id}`);

    const { data: turmas, error } = await supabase
        .from('turmas')
        .select(`
            *,
            atividades (nome)
        `)
        .eq('professor_id', professor.id);

    if (error) {
        console.error("Error fetching turmas:", error);
    } else {
        console.log("Turmas for professor d48f749a-f6d4-44d3-b68a-681fa8a615a3:");
        console.log(JSON.stringify(turmas, null, 2));
    }

    // List all policies on turmas
    const { data: policies, error: polError } = await supabase.rpc('get_policies', { table_name: 'turmas' });
    if (polError) {
        // Fallback if rpc doesn't exist
        console.log("\nTrying to check policies via pg_policies...");
        const { data: pgPolicies, error: pgError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'turmas');

        if (pgError) {
            console.log("Could not fetch policies via direct query (likely RLS on pg_policies or table doesn't exist)");
        } else {
            console.log("\nPolicies on 'turmas':");
            console.log(pgPolicies);
        }
    } else {
        console.log("\nPolicies on 'turmas':");
        console.log(policies);
    }
}

checkTurmaStatus();
