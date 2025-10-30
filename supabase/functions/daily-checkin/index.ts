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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get the user's wallet address from their profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }
    
    // Validate wallet address format
    if (!profile.wallet_address || profile.wallet_address.length < 32) {
      throw new Error('Invalid wallet address')
    }

    const walletAddress = profile.wallet_address
    
    // Use SERVER-SIDE date (UTC)
    const today = new Date().toISOString().slice(0, 10)
    
    console.log(`Check-in attempt for wallet: ${walletAddress}, date: ${today}`)

    // Check if already checked in today
    const { data: existingQuest } = await supabaseAdmin
      .from('daily_quests')
      .select('checkin_done')
      .eq('user_wallet', walletAddress)
      .eq('date', today)
      .maybeSingle()

    if (existingQuest?.checkin_done) {
      return new Response(
        JSON.stringify({ 
          error: 'Already checked in today',
          alreadyCheckedIn: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get yesterday's quest to check streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    
    const { data: yesterdayQuest } = await supabaseAdmin
      .from('daily_quests')
      .select('streak_count, checkin_done')
      .eq('user_wallet', walletAddress)
      .eq('date', yesterdayStr)
      .maybeSingle()
    
    const newStreak = (yesterdayQuest?.checkin_done) ? (yesterdayQuest.streak_count || 0) + 1 : 1
    
    // Insert today's quest with server-side date
    const { error: insertError } = await supabaseAdmin
      .from('daily_quests')
      .insert({ 
        user_wallet: walletAddress, 
        date: today,
        checkin_done: true,
        streak_count: newStreak,
        last_streak_date: today,
        rewarded_checkin: true
      })
    
    if (insertError) {
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ 
            error: 'Already checked in today',
            alreadyCheckedIn: true 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
      throw insertError
    }
    
    // Award points using internal function with service role
    const basePoints = 10
    const bonusPoints = newStreak === 7 ? 100 : 0
    const totalPoints = basePoints + bonusPoints
    
    const { error: pointsError } = await supabaseAdmin.rpc('add_user_points_internal', {
      target_wallet: walletAddress,
      points_to_add: totalPoints,
      reason: `Daily check-in (streak: ${newStreak})`,
      actor: 'system:daily-checkin'
    })
    
    if (pointsError) {
      console.error('Points error:', pointsError)
      throw pointsError
    }
    
    console.log(`Check-in successful for ${walletAddress}. Streak: ${newStreak}, Points: ${totalPoints}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        streak: newStreak,
        points: totalPoints,
        isStreakComplete: newStreak === 7
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in daily check-in:', error)
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
