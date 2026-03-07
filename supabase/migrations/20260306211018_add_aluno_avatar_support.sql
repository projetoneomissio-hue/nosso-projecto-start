-- Add foto_url column to alunos table
ALTER TABLE public.alunos
ADD COLUMN IF NOT EXISTS foto_url text;

-- Create public bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for avatars bucket
-- Drop existing policies if any (to allow re-running the script gracefully)
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars." ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated users can upload avatars."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated users can update avatars."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated users can delete avatars."
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'avatars' );
