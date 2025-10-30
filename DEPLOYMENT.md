# NoizLabs Deployment Guide

## Prerequisites

- Supabase project with admin access
- Edge function deployment capability
- Database migration permissions

## Deployment Steps

### 1. Database Migration

The security hardening migration was applied on 2025-10-30. If deploying to a new environment:

```bash
# The migration creates:
# - Audit tables (points_audit, resets_audit, admin_actions_audit)
# - wallet_ips table for immutable IP storage
# - User roles system (app_role enum, user_roles table)
# - add_user_points_internal() function
# - Updated RLS policies
# - Rate limiting system
```

**Verification:**
```sql
-- Verify audit tables exist
SELECT * FROM points_audit LIMIT 1;
SELECT * FROM resets_audit LIMIT 1;
SELECT * FROM admin_actions_audit LIMIT 1;

-- Verify add_user_points_internal exists
SELECT proname FROM pg_proc WHERE proname = 'add_user_points_internal';

-- Verify RLS policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Verify user_roles system
SELECT * FROM user_roles LIMIT 1;
```

### 2. Environment Variables

Set these secrets in your Supabase project:

```bash
# Required for reset-daily-quests function
CRON_SECRET=<generate-strong-random-secret>

# Already exists (Supabase provides these)
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_ANON_KEY=<your-anon-key>
```

**Generate CRON_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Deploy Edge Functions

Deploy all edge functions:

```bash
# The following functions will be deployed automatically:
# - authenticate-wallet (verify_jwt = false)
# - daily-checkin (verify_jwt = false)  
# - reset-daily-quests (verify_jwt = false, requires CRON_SECRET)
# - award-points (verify_jwt = true)
```

**Verification:**
```bash
# Test authenticate-wallet (should return validation error with empty body)
curl -X POST https://<project-ref>.supabase.co/functions/v1/authenticate-wallet \
  -H "Content-Type: application/json" \
  -d '{}'

# Test reset-daily-quests (should return 401 without secret)
curl -X POST https://<project-ref>.supabase.co/functions/v1/reset-daily-quests

# Test award-points (should return 401 without JWT)
curl -X POST https://<project-ref>.supabase.co/functions/v1/award-points
```

### 4. Update Cron Job

Update the pg_cron job to include the CRON_SECRET:

```sql
-- Remove old job if exists
SELECT cron.unschedule('reset-daily-quests-midnight');

-- Create new job with secret
SELECT cron.schedule(
  'reset-daily-quests-midnight',
  '0 0 * * *',  -- Every day at midnight UTC
  $$
  SELECT net.http_post(
    url:='https://<project-ref>.supabase.co/functions/v1/reset-daily-quests',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<your-cron-secret>'
    ),
    body:='{}'::jsonb
  );
  $$
);

-- Verify job is scheduled
SELECT * FROM cron.job WHERE jobname = 'reset-daily-quests-midnight';
```

### 5. Frontend Deployment

No additional frontend changes needed. The updated code:
- Calls secure `award-points` edge function instead of direct RPC
- Uses proper JWT authentication
- Includes error handling

Deploy the updated frontend code to your hosting platform.

### 6. Post-Deployment Verification

#### Test Authentication Flow
1. Connect wallet
2. Sign message
3. Verify JWT token is created
4. Check profile is created

#### Test Points System
1. Upload audio clip → should award 5 points
2. Vote on clip → should award 1 point
3. Vote 20 times → should award 5 bonus points
4. Create category → should award 50 + 10 points
5. Complete social task → should award task points

#### Test Daily Check-in
1. Perform daily check-in → should award 10 points
2. Try to check in again → should see "Already checked in today"
3. Check streak counter increments
4. On day 7, should award 110 points total (10 + 100 bonus)

#### Test Security
1. Try to call `add_user_points` RPC directly → should fail
2. Try to update profile referral_count → should fail
3. Try to call reset-daily-quests without secret → should fail (401)
4. Send malformed data to authenticate-wallet → should fail with validation error
5. Make 31 requests to award-points in 1 minute → should see rate limit (429)

#### Check Audit Logs
```sql
-- Check points audit
SELECT * FROM points_audit ORDER BY created_at DESC LIMIT 10;

-- Check for any errors
SELECT * FROM points_audit WHERE reason LIKE '%error%';

-- Check resets audit (after cron runs)
SELECT * FROM resets_audit ORDER BY created_at DESC LIMIT 5;
```

### 7. Monitoring

Set up monitoring for:

**Error Rates:**
```sql
-- Check for failed point awards
SELECT COUNT(*) FROM points_audit 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND reason LIKE '%error%';

-- Check for rate limit violations
SELECT identifier, COUNT(*) as violations
FROM rate_limits
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND action_name = 'award-points'
GROUP BY identifier
HAVING COUNT(*) > 30;
```

**Suspicious Activity:**
```sql
-- Check for large point awards
SELECT * FROM points_audit
WHERE points_to_add > 100
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check for multiple profiles from same IP
SELECT ip_address, COUNT(*) as profile_count
FROM profiles
WHERE ip_address IS NOT NULL
  AND ip_address != 'unknown'
GROUP BY ip_address
HAVING COUNT(*) > 1;
```

## Rollback Procedure

If issues arise:

### 1. Database Rollback
```sql
-- Rollback migration (if needed)
-- This will restore add_user_points as publicly callable
-- WARNING: This removes all security fixes

-- Grant execute back to public
GRANT EXECUTE ON FUNCTION public.add_user_points(text, integer) TO public;
GRANT EXECUTE ON FUNCTION public.add_user_points(text, integer) TO authenticated;

-- Drop new internal function
DROP FUNCTION IF EXISTS public.add_user_points_internal(text, integer, text, text);

-- Restore old profile policy
DROP POLICY IF EXISTS "Users can update username only" ON public.profiles;
CREATE POLICY "Users can update own profile only" ON public.profiles
  FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
```

### 2. Edge Function Rollback
```bash
# Revert edge functions to previous versions
# (use your deployment tool's rollback feature)
```

### 3. Frontend Rollback
```bash
# Revert frontend changes
# Replace edge function calls back to direct RPC calls
```

### 4. Verify Rollback
- Test authentication flow
- Test points system with direct RPC
- Test daily check-in
- Verify old functionality restored

## Troubleshooting

### Daily Check-in Not Working

**Symptoms:** Error when clicking daily check-in button

**Checks:**
```sql
-- Verify user profile exists
SELECT * FROM profiles WHERE wallet_address = '<wallet>';

-- Check if already checked in today
SELECT * FROM daily_quests 
WHERE user_wallet = '<wallet>' 
  AND date = CURRENT_DATE;

-- Check edge function logs
-- (use Supabase dashboard → Edge Functions → daily-checkin → Logs)
```

**Solutions:**
- Verify JWT token is valid
- Check if user is authenticated
- Verify edge function is deployed
- Check service role key is set

### Points Not Awarded

**Symptoms:** Action completed but no points awarded

**Checks:**
```sql
-- Check if award was logged
SELECT * FROM points_audit 
WHERE target_wallet = '<wallet>'
ORDER BY created_at DESC LIMIT 5;

-- Check if action record exists
SELECT * FROM audio_clips WHERE creator_wallet = '<wallet>' ORDER BY created_at DESC LIMIT 1;
SELECT * FROM votes WHERE voter_wallet = '<wallet>' ORDER BY created_at DESC LIMIT 1;
```

**Solutions:**
- Verify action was created in last 5 minutes
- Check JWT token is valid
- Verify edge function deployed correctly
- Check service role key is set
- Look for rate limiting (429 errors)

### Rate Limit Issues

**Symptoms:** Getting 429 errors

**Checks:**
```sql
-- Check rate limit records
SELECT * FROM rate_limits 
WHERE identifier = '<wallet>'
  AND created_at > NOW() - INTERVAL '1 minute';
```

**Solutions:**
- Wait 1 minute for rate limit window to reset
- If legitimate high-frequency use, increase rate limit in `award-points` function
- Check for client-side bugs causing excessive requests

### Referral System Issues

**Symptoms:** Referral bonus not awarded

**Checks:**
```sql
-- Verify referral relationship
SELECT referred_by FROM profiles WHERE wallet_address = '<wallet>';

-- Check if this is first category
SELECT COUNT(*) FROM categories WHERE creator_wallet = '<wallet>';

-- Check if referral was processed
SELECT * FROM points_audit 
WHERE target_wallet = '<wallet>' 
  AND reason LIKE '%referral%';
```

**Solutions:**
- Verify user has referred_by set
- Verify this is user's first category
- Check edge function logs
- Verify category was created in last 5 minutes

## Support

For deployment issues:
1. Check edge function logs in Supabase dashboard
2. Review database audit logs
3. Check browser console for errors
4. Review this guide's troubleshooting section

---

Last Updated: 2025-10-30
