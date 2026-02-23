
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUserUnidades() {
    console.log("=== CHECKING USER UNIDADES ===\n");

    const userId = 'd48f749a-f6d4-44d3-b68a-681fa8a615a3'; // neomissiocuritiba@gmail.com

    const { data: userUnidades, error } = await supabase
        .from('user_unidades')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching user_unidades:", error);
    } else {
        console.log("User Unidades for d48f749a-f6d4-44d3-b68a-681fa8a615a3:");
        console.log(JSON.stringify(userUnidades, null, 2));
    }
}

checkUserUnidades();
