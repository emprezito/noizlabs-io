# NoizLabs Security Architecture

## Overview
This document describes the security architecture and measures implemented in the NoizLabs platform.

## Security Fixes Implemented (2025-10-30)

### 1. Points System Hardening
**Issue:** `add_user_points()` was publicly callable, allowing any user to award unlimited points to any wallet.

**Fix:**
- Revoked public execute permissions on `add_user_points()` and `add_user_points_secure()`
- Created `add_user_points_internal()` with SECURITY DEFINER that only service role can execute
- Created new `award-points` edge function that verifies actions server-side before awarding points
- All client-side code now calls the secure edge function instead of direct RPC

**Impact:** Users can no longer manipulate the points economy. All point awards are verified server-side.

### 2. Profile Security
**Issue:** Users could update system-managed fields in their profiles (referral_count, ip_address, referred_users) through direct database updates.

**Fix:**
- Updated profiles RLS policy with WITH CHECK constraint
- Only username field can be updated by users
- All system-managed fields are protected from client-side updates
- Referral counts and IP addresses can only be modified by server-side functions

**Impact:** Prevents referral fraud and Sybil attack bypasses.

### 3. Daily Quest Reset Protection
**Issue:** `reset-daily-quests` edge function was publicly accessible without authentication.

**Fix:**
- Added CRON_SECRET environment variable requirement
- Function now requires `x-cron-secret` header to execute
- All resets are logged to `resets_audit` table
- Added rate limiting and idempotency checks

**Impact:** Only authorized cron jobs can reset daily quests. Prevents DoS attacks.

### 4. Input Validation
**Issue:** Edge functions lacked comprehensive input validation, exposing them to DoS and injection attacks.

**Fix:**
- Added strict validation in `authenticate-wallet`:
  - Wallet address format (32-44 chars, base58)
  - Signature length validation (64-88 chars)
  - Message length limit (500 chars max)
  - Username validation (alphanumeric, max 50 chars)
  - Request body size limit (10KB max)
- Enhanced `daily-checkin` with wallet format validation
- All edge functions now have try-catch with generic error messages

**Impact:** Prevents resource exhaustion, crashes from malformed data, and information leakage.

### 5. Daily Check-in Fix
**Issue:** Daily check-in wasn't working due to revoked permissions on points function.

**Fix:**
- Updated `daily-checkin` to use service role and call `add_user_points_internal()`
- Fixed JWT verification flow
- Added proper error handling and logging

**Impact:** Daily check-ins now work correctly on all platforms.

### 6. Audit Logging
**Issue:** No audit trail for sensitive operations.

**Fix:**
- Created audit tables:
  - `points_audit`: Logs all point awards with reason and actor
  - `resets_audit`: Logs all daily quest resets
  - `admin_actions_audit`: Reserved for future admin actions
- All tables have RLS denying public access
- Comprehensive logging in all edge functions

**Impact:** Full audit trail for investigating issues and detecting abuse.

### 7. Rate Limiting
**Issue:** No rate limiting on point-awarding actions.

**Fix:**
- Created `rate_limits` table with `check_rate_limit()` function
- Implemented in-memory rate limiting in `award-points` edge function
- 30 requests per minute per wallet
- Rate limit violations return 429 status

**Impact:** Prevents point farming through rapid repeated actions.

## Architecture

### Points System
```
Client Action → Secure Edge Function → Validation → add_user_points_internal() → Database
```

**Key Points:**
- All point awards go through `award-points` edge function
- Function verifies JWT token and gets wallet from profile
- Validates the action was performed by checking database records
- Enforces time limits (5 minutes) to prevent replay attacks
- Uses service role to call internal function

### Supported Actions
1. **upload**: Awards 5 points for audio uploads
2. **vote**: Awards 1 point per vote + 5 point bonus at 20 votes
3. **category**: Awards 50 points + 10 point daily quest bonus
4. **referral**: Awards 100 points to both user and referrer
5. **task**: Awards task-specific points for social tasks

### Profile Updates
Only the `username` field can be updated by users. All other fields (wallet_address, referral_count, ip_address, referral_code, referred_by, referred_users) are immutable from the client side.

### Edge Functions

#### Public Functions (verify_jwt = false)
- `authenticate-wallet`: Wallet authentication with signature verification
  - Validates all inputs strictly
  - Implements IP-based Sybil protection
  - Creates auth users and profiles

#### Authenticated Functions (verify_jwt = true)
- `award-points`: Awards points after server-side verification
- `daily-checkin`: Records daily check-ins with streak tracking

#### Protected Functions (require secret)
- `reset-daily-quests`: Resets daily quests (cron only)
  - Requires CRON_SECRET in x-cron-secret header
  - Logs all resets to audit table

## Database Security

### RLS Policies
All tables have Row Level Security enabled with appropriate policies:

- **profiles**: Users can only update their own username
- **user_points**: Only functions can modify points (no direct access)
- **daily_quests**: Users can only view/update their own quests
- **votes**: Users can only insert votes with their own wallet
- **audio_clips**: Anyone can view, only authenticated users can insert
- **categories**: Anyone can view active categories, authenticated users can create
- **tasks**: Read-only for all authenticated users
- **user_tasks**: Users can only view/update their own tasks
- **Audit tables**: No public access, service role only

### Database Functions

#### add_user_points_internal(target_wallet, points_to_add, reason, actor)
- SECURITY DEFINER function
- No public execute permissions
- Validates points range (1-1000)
- Logs to points_audit table
- Called only by edge functions with service role

#### check_rate_limit(action_name, identifier, max_requests, window_seconds)
- Checks if request should be rate limited
- Returns boolean
- Manages rate_limits table

#### has_role(user_id, role)
- SECURITY DEFINER function
- Checks if user has a specific role
- Used in RLS policies to avoid recursion

## Best Practices

### For Developers

1. **Never expose service role key in client code**
2. **Always validate inputs in edge functions**
3. **Use the award-points edge function for all point awards**
4. **Log sensitive operations to audit tables**
5. **Test rate limits with high-frequency requests**
6. **Never store secrets in code or logs**

### For Operations

1. **Rotate CRON_SECRET regularly**
2. **Monitor audit logs for suspicious activity**
3. **Review rate_limits table for patterns**
4. **Check points_audit for anomalies**
5. **Backup database before migrations**

## Remaining Considerations

### Future Enhancements
1. **IP Storage**: Consider moving IP addresses to separate immutable `auth.wallet_ips` table
2. **Admin System**: Implement role-based access control for admin features
3. **2FA**: Consider adding two-factor authentication for high-value actions
4. **Webhook Security**: Add signature verification for any webhooks
5. **More Rate Limits**: Add per-action rate limits (e.g., max 10 uploads per hour)

### Monitoring
Monitor these metrics:
- Failed authentication attempts
- Rate limit violations
- Large point awards (>100 points)
- Multiple accounts from same IP
- Unusual patterns in audit logs

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set (CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Database migration applied successfully
- [ ] All edge functions deployed
- [ ] Rate limits tested
- [ ] Audit logging verified
- [ ] RLS policies verified
- [ ] Input validation tested with malformed data
- [ ] Security scan run and reviewed

## Rollback Procedure

If issues arise after deployment:

1. **Restore database backup** from before migration
2. **Revert edge function changes** to previous deployment
3. **Re-enable old functions** if needed
4. **Investigate issue** in staging environment
5. **Fix and redeploy** after verification

## Contact

For security concerns or to report vulnerabilities, please contact the security team.

---

Last Updated: 2025-10-30
