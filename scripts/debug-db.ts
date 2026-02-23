
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Manual loading of .env if needed, but let's assume we can find the keys in the codebase
// Actually, let's look at src/integrations/supabase/client.ts for the URL/Key
const clientPath = 'c:/Users/NeoMissio/Documents/Neomissio14022026/nosso-projecto-start/src/integrations/supabase/client.ts';
const clientFile = fs.readFileSync(clientPath, 'utf8');
const supabaseUrlMatch = clientFile.match(/supabaseUrl\s*=\s*"(.*?)"/);
const supabaseAnonKeyMatch = clientFile.match(/supabaseAnonKey\s*=\s*"(.*?)"/);

// Since I can't easily find the key if it's in env vars, I'll check .env
const envPath = 'c:/Users/NeoMissio/Documents/Neomissio14022026/nosso-projecto-start/.env';
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '';
    supabaseAnonKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase keys not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
    console.log('--- ATIVIDADES ---');
    const { data: atividades } = await supabase.from('atividades').select('id, nome');
    console.log(JSON.stringify(atividades, null, 2));

    console.log('--- TURMAS ---');
    const { data: turmas } = await supabase.from('turmas').select('id, nome, professor_id');
    console.log(JSON.stringify(turmas, null, 2));

    console.log('--- PROFESSORES ---');
    const { data: professores } = await supabase.from('professores').select('id, user_id');
    console.log(JSON.stringify(professores, null, 2));
}

debug();
