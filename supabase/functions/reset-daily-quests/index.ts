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

    const today = new Date().toISOString().slice(0, 10)
    
    console.log(`Resetting daily quests for date: ${today}`)

    // Delete all daily quest records that are not today's date
    const { error: deleteError, count } = await supabase
      .from('daily_quests')
      .delete()
      .neq('date', today)

    if (deleteError) {
      console.error('Error deleting old quests:', deleteError)
      throw deleteError
    }

    console.log(`Successfully deleted ${count || 0} old daily quest records`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: count || 0,
        message: 'Daily quests reset successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error resetting daily quests:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
