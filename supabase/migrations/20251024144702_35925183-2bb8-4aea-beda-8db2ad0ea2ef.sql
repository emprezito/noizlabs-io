-- Add audio_url column to audio_clips table to store uploaded audio files
ALTER TABLE public.audio_clips
ADD COLUMN audio_url TEXT;

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-clips',
  'audio-clips',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
);

-- Storage policies for audio clips bucket
CREATE POLICY "Anyone can view audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-clips');

CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-clips');

CREATE POLICY "Users can update their own audio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio-clips');

CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-clips');