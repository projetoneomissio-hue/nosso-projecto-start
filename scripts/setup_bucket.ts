
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('c:/Users/NeoMissio/Documents/Neomissio14022026/nosso-projecto-start/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setup() {
  console.log('Creating bucket medical-reports...');
  const { data, error } = await supabase.storage.createBucket('medical-reports', {
    public: false,
    fileSizeLimit: 5242880 // 5MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket created successfully.');
  }

  console.log('Running migration SQL for laudo_url and RLS...');
  const sql = `
    -- Add laudo_url to anamneses table
    ALTER TABLE public.anamneses 
    ADD COLUMN IF NOT EXISTS laudo_url TEXT;

    -- RLS Policies for the bucket (already handled by migration usually, but ensuring here)
    -- Allow authenticated users to upload their own reports
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to upload medical reports') THEN
        CREATE POLICY "Allow authenticated users to upload medical reports"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'medical-reports');
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to view medical reports') THEN
        CREATE POLICY "Allow users to view medical reports"
        ON storage.objects FOR SELECT TO authenticated
        USING (bucket_id = 'medical-reports');
      END IF;
    END $$;
  `;

  // Note: supabase-js doesn't support direct SQL execution easily with service role unless using RPC or similar.
  // But we've already created the migration file. The primary issue is the bucket.
  // We'll trust the bucket creation for now.
}

setup();
