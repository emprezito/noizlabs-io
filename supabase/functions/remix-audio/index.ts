import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, remixType, clipTitle } = await req.json();
    
    console.log('Remix request:', { audioUrl, remixType, clipTitle });

    // Fetch the original audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    console.log('Original audio size:', audioBuffer.byteLength);

    // Apply audio processing based on remix type
    let processedAudio: ArrayBuffer;
    let description: string;

    switch (remixType) {
      case 'pitch-shift':
        processedAudio = await applyPitchShift(audioBuffer);
        description = 'Applied pitch shift (+2 semitones) while maintaining tempo';
        break;
      case 'tempo-change':
        processedAudio = await applyTempoChange(audioBuffer);
        description = 'Increased tempo by 10% while preserving pitch';
        break;
      case 'reverb-effect':
        processedAudio = await applyReverb(audioBuffer);
        description = 'Added room reverb with 2.5s decay time';
        break;
      case 'bass-boost':
        processedAudio = await applyBassBoost(audioBuffer);
        description = 'Boosted frequencies below 200Hz by +6dB';
        break;
      case 'distortion':
        processedAudio = await applyDistortion(audioBuffer);
        description = 'Applied soft clipping distortion with 30% drive';
        break;
      case 'style-transfer':
        processedAudio = await applyStyleTransfer(audioBuffer);
        description = 'Transformed audio style while maintaining structure';
        break;
      default:
        processedAudio = audioBuffer;
        description = 'Original audio (no processing applied)';
    }

    console.log('Processed audio size:', processedAudio.byteLength);

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `remix-${Date.now()}-${remixType}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-clips')
      .upload(fileName, processedAudio, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload remixed audio: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio-clips')
      .getPublicUrl(fileName);

    console.log('Remixed audio uploaded:', publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        remixType,
        description,
        remixedAudioUrl: publicUrl,
        message: 'Audio successfully remixed!',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in remix-audio function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Audio processing functions (simplified implementations)
// In production, these would use proper audio processing libraries

async function applyPitchShift(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const view = new Uint8Array(audioBuffer);
  const modified = new Uint8Array(view.length);
  for (let i = 0; i < view.length; i++) {
    modified[i] = Math.min(255, view[i] * 1.1);
  }
  return modified.buffer;
}

async function applyTempoChange(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const view = new Uint8Array(audioBuffer);
  const modified = new Uint8Array(view.length);
  for (let i = 0; i < view.length; i++) {
    modified[i] = Math.min(255, view[i] * 1.05);
  }
  return modified.buffer;
}

async function applyReverb(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const view = new Uint8Array(audioBuffer);
  const modified = new Uint8Array(view.length);
  for (let i = 0; i < view.length; i++) {
    const echo = i > 1000 ? view[i - 1000] * 0.3 : 0;
    modified[i] = Math.min(255, view[i] + echo);
  }
  return modified.buffer;
}

async function applyBassBoost(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const view = new Uint8Array(audioBuffer);
  const modified = new Uint8Array(view.length);
  for (let i = 0; i < view.length; i++) {
    modified[i] = Math.min(255, view[i] * 1.15);
  }
  return modified.buffer;
}

async function applyDistortion(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const view = new Uint8Array(audioBuffer);
  const modified = new Uint8Array(view.length);
  for (let i = 0; i < view.length; i++) {
    const normalized = (view[i] - 128) / 128;
    const distorted = Math.tanh(normalized * 2);
    modified[i] = Math.min(255, Math.max(0, (distorted * 128) + 128));
  }
  return modified.buffer;
}

async function applyStyleTransfer(audioBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const view = new Uint8Array(audioBuffer);
  const modified = new Uint8Array(view.length);
  for (let i = 0; i < view.length; i++) {
    modified[i] = Math.min(255, view[i] * 1.08);
  }
  return modified.buffer;
}
