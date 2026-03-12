
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('c:/Users/NeoMissio/Documents/Neomissio14022026/nosso-projecto-start/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const { data, error } = await supabase.from('anamneses').select('pne_cid, tem_laudo').limit(1);
  if (error) {
    console.log('FIELDS_MISSING:', error.message);
  } else {
    console.log('FIELDS_EXIST');
  }
}

check();
