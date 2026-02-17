-- Add foto_url to alunos
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Create Storage Bucket 'student-photos'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects? (Usually enabled by default)

-- STORAGE POLICIES
-- Drop existing to avoid conflict if re-applying
DROP POLICY IF EXISTS "Public Select Photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Photos" ON storage.objects;

-- 1. Public Read
CREATE POLICY "Public Select Photos"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'student-photos' );

-- 2. Authenticated Upload
CREATE POLICY "Authenticated Upload Photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'student-photos' );

-- 3. Authenticated Update/Delete (Optional, for now just Upload)
CREATE POLICY "Authenticated Update Photos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'student-photos' );
