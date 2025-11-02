-- Add image_url column to audio_clips table
ALTER TABLE public.audio_clips
ADD COLUMN image_url text;

COMMENT ON COLUMN public.audio_clips.image_url IS 'URL to the image/cover art for the audio clip';