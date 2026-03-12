-- Add laudo_url to anamneses table
ALTER TABLE public.anamneses 
ADD COLUMN IF NOT EXISTS laudo_url TEXT;

-- Create storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for the bucket
-- Allow authenticated users to upload their own reports
CREATE POLICY "Allow authenticated users to upload medical reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'medical-reports');

-- Allow users to view their own reports (and admin/coordination roles)
CREATE POLICY "Allow users to view medical reports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'medical-reports');

-- Allow deletion (if needed)
CREATE POLICY "Allow users to delete their medical reports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'medical-reports');
