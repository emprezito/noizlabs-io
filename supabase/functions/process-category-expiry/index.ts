import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find expired categories
    const { data: expiredCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, creator_wallet')
      .lt('expires_at', new Date().toISOString())

    if (categoriesError) throw categoriesError

    console.log(`Found ${expiredCategories?.length || 0} expired categories`)

    for (const category of expiredCategories || []) {
      // Get all clips in this category with vote counts
      const { data: clips, error: clipsError } = await supabase
        .from('audio_clips')
        .select('id, creator_wallet')
        .eq('category_id', category.id)

      if (clipsError) throw clipsError

      if (!clips || clips.length === 0) continue

      // Get vote counts for each clip
      const clipsWithVotes = await Promise.all(
        clips.map(async (clip) => {
          const { data: voteCount } = await supabase.rpc('get_clip_votes', { 
            clip_uuid: clip.id 
          })
          return { ...clip, votes: voteCount || 0 }
        })
      )

      // Find the clip with the most votes
      const winnerClip = clipsWithVotes.reduce((prev, current) => 
        (current.votes > prev.votes) ? current : prev
      )

      // Award 25 points to the winner's wallet
      if (winnerClip && winnerClip.votes > 0) {
        await supabase.rpc('add_user_points', { 
          wallet: winnerClip.creator_wallet, 
          points_to_add: 25 
        })
        console.log(`Awarded 25 points to ${winnerClip.creator_wallet} for winning category ${category.name}`)
      }

      // Delete the expired category (cascade will delete clips and votes)
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (deleteError) throw deleteError
      console.log(`Deleted expired category ${category.name}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: expiredCategories?.length || 0 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error processing category expiry:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
