import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import * as base58 from "https://deno.land/std@0.224.0/encoding/base58.ts";
import nacl from "https://esm.sh/tweetnacl@1.0.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, signature, message, username } = await req.json();

    if (!walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP address for Sybil protection
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log('Authenticating wallet:', walletAddress, 'from IP:', clientIp);

    // Verify the signature using Web Crypto API
    const verified = await verifySignature(walletAddress, signature, message);
    
    if (!verified) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user exists with this wallet
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id, wallet_address, username, ip_address')
      .eq('wallet_address', walletAddress)
      .single();

    // Sybil protection: Check if this IP has been used with a different wallet
    if (!existingProfile && clientIp !== 'unknown') {
      const { data: ipCheck } = await supabaseAdmin
        .from('profiles')
        .select('wallet_address')
        .eq('ip_address', clientIp)
        .single();

      if (ipCheck) {
        console.log('Sybil attempt detected: IP', clientIp, 'already used by wallet', ipCheck.wallet_address);
        return new Response(
          JSON.stringify({ error: 'This IP address is already associated with another wallet' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let userId: string;
    let isNewUser = false;

    if (existingProfile?.user_id) {
      // User exists, use existing user_id
      userId = existingProfile.user_id;
      console.log('Existing user found:', userId);
    } else {
      // Create new auth user
      // Use wallet address as email (since we don't have email)
      const email = `${walletAddress}@wallet.noizlabs.com`;
      const password = crypto.randomUUID(); // Random password (user won't use it)

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm
        user_metadata: {
          wallet_address: walletAddress,
          username: username || `User_${walletAddress.slice(0, 8)}`,
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = authData.user.id;
      isNewUser = true;
      console.log('New user created:', userId);

      // Update or create profile with user_id and IP
      if (existingProfile) {
        // Update existing profile with user_id and IP
        await supabaseAdmin
          .from('profiles')
          .update({ 
            user_id: userId,
            ip_address: clientIp 
          })
          .eq('wallet_address', walletAddress);
      } else {
        // Create new profile with IP
        await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: userId,
            wallet_address: walletAddress,
            username: username || `User_${walletAddress.slice(0, 8)}`,
            ip_address: clientIp,
          });
      }
    }

    // Generate session token for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${walletAddress}@wallet.noizlabs.com`,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return user data and session
    return new Response(
      JSON.stringify({
        success: true,
        userId,
        walletAddress,
        isNewUser,
        // Return the magic link properties - user needs to visit this to get session
        properties: sessionData.properties,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in authenticate-wallet:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function verifySignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // Decode the signature and public key from base58
    const signatureUint8 = base58.decodeBase58(signature);
    const publicKeyUint8 = base58.decodeBase58(walletAddress);

    // Encode message to bytes
    const messageUint8 = new TextEncoder().encode(message);

    // Verify the signature using tweetnacl
    const isValid = nacl.sign.detached.verify(
      messageUint8,
      signatureUint8,
      publicKeyUint8
    );

    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
