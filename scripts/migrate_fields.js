const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
    console.log("Running migration...");
    const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: `
            ALTER TABLE solicitacoes_matricula ADD COLUMN IF NOT EXISTS email_responsavel text;
            ALTER TABLE solicitacoes_matricula ADD COLUMN IF NOT EXISTS nome_responsavel text;
        `
    });

    if (error) {
        console.error("Migration error:", error);
        // If RPC fails, try direct query if possible (rarely enabled for security)
        process.exit(1);
    } else {
        console.log("Migration successful:", data);
        process.exit(0);
    }
}

migrate();
