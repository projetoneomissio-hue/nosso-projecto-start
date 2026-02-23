
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTableColumns() {
    console.log("=== CHECKING ANAMNESES COLUMNS ===\n");

    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'anamneses' });

    if (error) {
        // Fallback: try to query a single row and see the keys
        console.log("RPC 'get_table_columns' not found, trying query fallback...");
        const { data: sample, error: queryError } = await supabase
            .from('anamneses')
            .select('*')
            .limit(1);

        if (queryError) {
            console.error("Error fetching anamneses:", queryError);
        } else if (sample && sample.length > 0) {
            console.log("Columns found in sample row:", Object.keys(sample[0]));
        } else {
            console.log("Table is empty, cannot infer columns from sample.");
            // Try to query information_schema if possible (might not work with service role restricted)
            const { data: schemaData, error: schemaError } = await supabase
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_name', 'anamneses');

            if (schemaError) {
                console.error("Error fetching from information_schema:", schemaError);
            } else {
                console.log("Columns from information_schema:", schemaData);
            }
        }
    } else {
        console.log("Columns:", data);
    }
}

checkTableColumns();
