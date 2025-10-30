import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting map: wallet -> array of timestamps
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS_PER_MINUTE = 30

function checkRateLimit(wallet: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(wallet) || []
  
  // Remove old timestamps outside the window
  const validTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW)
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false
  }
  
  validTimestamps.push(now)
  rateLimitMap.set(wallet, validTimestamps)
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's wallet from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('wallet_address')
      .eq('user_id', user.id)
      .single()

    if (!profile?.wallet_address) {
      throw new Error('Profile not found')
    }

    const walletAddress = profile.wallet_address

    // Rate limiting
    if (!checkRateLimit(walletAddress)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        }
      )
    }

    // Parse request body
    const body = await req.json()
    const { action, data } = body

    if (!action) {
      throw new Error('Action required')
    }

    let pointsAwarded = 0
    let reason = ''

    switch (action) {
      case 'upload': {
        // Verify the clip was just uploaded by this wallet
        const { clipId } = data
        if (!clipId) throw new Error('Clip ID required')

        const { data: clip } = await supabaseAdmin
          .from('audio_clips')
          .select('creator_wallet, created_at')
          .eq('id', clipId)
          .single()

        if (!clip || clip.creator_wallet !== walletAddress) {
          throw new Error('Invalid clip')
        }

        // Check if clip was created in last 5 minutes
        const clipAge = Date.now() - new Date(clip.created_at).getTime()
        if (clipAge > 5 * 60 * 1000) {
          throw new Error('Clip too old')
        }

        pointsAwarded = 5
        reason = 'Audio upload'
        break
      }

      case 'vote': {
        // Verify the vote was just cast by this wallet
        const { voteId } = data
        if (!voteId) throw new Error('Vote ID required')

        const { data: vote } = await supabaseAdmin
          .from('votes')
          .select('voter_wallet, created_at')
          .eq('id', voteId)
          .single()

        if (!vote || vote.voter_wallet !== walletAddress) {
          throw new Error('Invalid vote')
        }

        // Check if vote was created in last 5 minutes
        const voteAge = Date.now() - new Date(vote.created_at).getTime()
        if (voteAge > 5 * 60 * 1000) {
          throw new Error('Vote too old')
        }

        pointsAwarded = 1
        reason = 'Vote cast'

        // Check for 20-vote bonus
        const today = new Date().toISOString().slice(0, 10)
        const { data: quest } = await supabaseAdmin
          .from('daily_quests')
          .select('votes_count, rewarded_votes')
          .eq('user_wallet', walletAddress)
          .eq('date', today)
          .maybeSingle()

        if (quest && quest.votes_count >= 20 && !quest.rewarded_votes) {
          pointsAwarded += 5
          reason = 'Vote cast + 20 votes bonus'
          
          await supabaseAdmin
            .from('daily_quests')
            .update({ rewarded_votes: true })
            .eq('user_wallet', walletAddress)
            .eq('date', today)
        }
        break
      }

      case 'category': {
        // Verify the category was just created by this wallet
        const { categoryId } = data
        if (!categoryId) throw new Error('Category ID required')

        const { data: category } = await supabaseAdmin
          .from('categories')
          .select('creator_wallet, created_at')
          .eq('id', categoryId)
          .single()

        if (!category || category.creator_wallet !== walletAddress) {
          throw new Error('Invalid category')
        }

        // Check if category was created in last 5 minutes
        const categoryAge = Date.now() - new Date(category.created_at).getTime()
        if (categoryAge > 5 * 60 * 1000) {
          throw new Error('Category too old')
        }

        pointsAwarded = 50
        reason = 'Category creation'

        // Award daily quest bonus if not already rewarded
        const today = new Date().toISOString().slice(0, 10)
        const { data: quest } = await supabaseAdmin
          .from('daily_quests')
          .select('rewarded_category')
          .eq('user_wallet', walletAddress)
          .eq('date', today)
          .maybeSingle()

        if (!quest?.rewarded_category) {
          pointsAwarded += 10
          reason = 'Category creation + daily quest'
          
          await supabaseAdmin
            .from('daily_quests')
            .update({ rewarded_category: true })
            .eq('user_wallet', walletAddress)
            .eq('date', today)
        }
        break
      }

      case 'referral': {
        // Verify this is user's first category and they were referred
        const { categoryId, referrerWallet } = data
        if (!categoryId || !referrerWallet) {
          throw new Error('Category ID and referrer wallet required')
        }

        // Verify category exists and is user's first
        const { data: categories } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('creator_wallet', walletAddress)

        if (!categories || categories.length !== 1) {
          throw new Error('Not first category')
        }

        // Verify referral relationship
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('referred_by')
          .eq('wallet_address', walletAddress)
          .single()

        if (!profile || profile.referred_by !== referrerWallet) {
          throw new Error('Invalid referral')
        }

        // Award 100 points to both user and referrer
        await supabaseAdmin.rpc('add_user_points_internal', {
          target_wallet: walletAddress,
          points_to_add: 100,
          reason: 'Referral bonus (referred user)',
          actor: 'system:referral'
        })

        await supabaseAdmin.rpc('add_user_points_internal', {
          target_wallet: referrerWallet,
          points_to_add: 100,
          reason: 'Referral bonus (referrer)',
          actor: 'system:referral'
        })

        return new Response(
          JSON.stringify({ 
            success: true,
            points: 100,
            message: 'Referral bonus awarded'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      case 'task': {
        // Verify the task was just completed by this wallet
        const { taskId } = data
        if (!taskId) throw new Error('Task ID required')

        const { data: task } = await supabaseAdmin
          .from('tasks')
          .select('points_reward')
          .eq('id', taskId)
          .single()

        if (!task) {
          throw new Error('Invalid task')
        }

        // Verify user task record exists
        const { data: userTask } = await supabaseAdmin
          .from('user_tasks')
          .select('created_at')
          .eq('user_wallet', walletAddress)
          .eq('task_id', taskId)
          .single()

        if (!userTask) {
          throw new Error('Task not completed')
        }

        // Check if completed in last 5 minutes
        const taskAge = Date.now() - new Date(userTask.created_at).getTime()
        if (taskAge > 5 * 60 * 1000) {
          throw new Error('Task completion too old')
        }

        pointsAwarded = task.points_reward
        reason = 'Task completion'
        break
      }

      default:
        throw new Error('Invalid action')
    }

    // Award points using internal function
    const { error: pointsError } = await supabaseAdmin.rpc('add_user_points_internal', {
      target_wallet: walletAddress,
      points_to_add: pointsAwarded,
      reason,
      actor: user.id
    })

    if (pointsError) {
      console.error('Points error:', pointsError)
      throw pointsError
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        points: pointsAwarded,
        reason
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error awarding points:', error)
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
