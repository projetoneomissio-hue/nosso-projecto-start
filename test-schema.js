import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testUpdate() {
    const payload = {
        user_id: 'd48f749a-f6d4-44d3-b68a-681fa8a615a3',
        especialidade: 'Jiu-Jitsu',
        tipo_contrato: 'fixo',
        valor_fixo: 2500,
        percentual_comissao: 0,
        ativo: true,
        is_volunteer: false
    };

    console.log("SENDING:", payload);

    const { data, error } = await supabase
        .from("professores")
        .update(payload)
        .eq("id", '64f74039-7ded-47fd-8525-3e777914c207')
        .select();

    console.log("RESPONSE DATA:", data);
    console.log("RESPONSE ERROR:", error);
}

testUpdate();
