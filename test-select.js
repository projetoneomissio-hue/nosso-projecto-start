import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function testSelect() {
    const { data, error } = await supabase.from('professores').select('*, tipo_contrato, valor_fixo, is_volunteer').limit(1);
    console.log("SELECT:", data);
    console.log("ERROR:", error);
}

testSelect();
