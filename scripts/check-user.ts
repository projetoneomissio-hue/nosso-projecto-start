
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUser(email) {
    console.log(`Checking user: ${email}`);

    // 1. Get auth user
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Error listing users:', authError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.log('User not found in auth.users');
        return;
    }

    console.log('User ID:', user.id);

    // 2. Get profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    console.log('Profile:', profile || 'Not found');
    if (profileError) console.error('Profile error:', profileError);

    // 3. Get roles
    const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

    console.log('Roles:', roles || 'None');
    if (roleError) console.error('Role error:', roleError);
}

checkUser('neomissiocuritiba@gmail.com');
