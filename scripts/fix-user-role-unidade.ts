
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixUserRole() {
    console.log("=== FIXING USER ROLE IN USER_UNIDADES ===\n");

    const userId = 'd48f749a-f6d4-44d3-b68a-681fa8a615a3'; // neomissiocuritiba@gmail.com
    const unidadeId = '00000000-0000-0000-0000-000000000001'; // Matriz

    const { data, error } = await supabase
        .from('user_unidades')
        .update({ role: 'professor' })
        .eq('user_id', userId)
        .eq('unidade_id', unidadeId);

    if (error) {
        console.error("Error updating role:", error);
    } else {
        console.log("Role updated successfully to 'professor' in 'user_unidades'.");
    }
}

fixUserRole();
