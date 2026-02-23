
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
    const userId = 'd48f749a-f6d4-44d3-b68a-681fa8a615a3';
    console.log('Checking User:', userId);

    const { data: profs, error } = await supabase.from('professores').select('*').eq('user_id', userId);
    console.log('Profs in DB:', JSON.stringify(profs, null, 2));

    const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', userId);
    console.log('Roles in DB:', JSON.stringify(roles, null, 2));
}

check();
