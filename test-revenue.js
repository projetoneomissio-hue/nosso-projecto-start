import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testRevenue() {
    const { data, error } = await supabase.rpc('get_monthly_revenue', { year_ref: 2026 });
    console.log("REVENUE DATA:", data);
    console.log("REVENUE ERROR:", error);
}

testRevenue();
