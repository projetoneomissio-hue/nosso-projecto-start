import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Using ANON KEY
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testAnon() {
    const { data, error } = await supabase.from('professores').select('*').limit(1);
    console.log("ANON GET:", data ? 'success' : error);

    if (data && data.length > 0) {
        console.log("Row has tipo_contrato:", 'tipo_contrato' in data[0]);
    }
}

testAnon();
