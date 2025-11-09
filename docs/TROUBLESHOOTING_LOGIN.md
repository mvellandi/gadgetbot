# Troubleshooting Login Issues

## Issue: Login Hangs and Times Out

**Symptoms:**
- Clicking "Sign In" redirects to `/login?redirect=%2Fadmin`
- Page hangs/loads indefinitely
- Eventually times out and redirects to Zitadel login page
- URL shows: `https://gadgetbot-auth.vellandi.net/ui/v2/login/login?authRequest=V2_...`

---

## Diagnostic Steps

### 1. Check Browser Console

Open browser DevTools (F12) and check Console tab for errors:

```
Look for:
- Network errors (CORS, timeout, connection refused)
- JavaScript errors
- Better Auth client errors
```

### 2. Check Network Tab

In DevTools Network tab, click "Sign in with Zitadel" and monitor:

1. **Initial request** to `/api/auth/signin/zitadel` or similar
2. **OAuth redirect** to Zitadel authorization endpoint
3. **Callback** from Zitadel back to `/api/auth/callback/zitadel`

**What to look for:**
- Failed requests (red in Network tab)
- Requests that hang/timeout
- 404 errors
- CORS errors

### 3. Verify Environment Variables

Check Coolify environment variables for `gadgetbot` app:

```bash
# Should be set to your production domain
BETTER_AUTH_URL=https://gadgetbot.vellandi.net

# Should match Zitadel issuer (without /ui/v2/login)
ZITADEL_ISSUER_URL=https://gadgetbot-auth.vellandi.net

# Should match Zitadel OAuth app client ID
ZITADEL_CLIENT_ID=<your-client-id>

# Should match Zitadel OAuth app client secret (if PKCE not used)
ZITADEL_CLIENT_SECRET=<your-client-secret>
```

### 4. Verify Zitadel OAuth Application Settings

In Zitadel Console (`https://gadgetbot-auth.vellandi.net`):

1. Go to your OAuth application settings
2. Check **Redirect URIs**:
   ```
   Should include:
   https://gadgetbot.vellandi.net/api/auth/callback/zitadel
   ```
3. Check **Post Logout Redirect URIs**:
   ```
   Should include:
   https://gadgetbot.vellandi.net
   ```
4. Verify **Grant Types** enabled:
   - Authorization Code
   - Authorization Code with PKCE (if using PKCE)
   - Refresh Token

### 5. Check Application Logs

In Coolify, check logs for `gadgetbot` application:

```bash
# Look for:
- Better Auth initialization errors
- OAuth callback errors
- Database connection errors
- "ZITADEL_ISSUER_URL not set" or similar
```

---

## Common Issues & Fixes

### Issue 1: BETTER_AUTH_URL Mismatch

**Symptom**: OAuth redirect loop or callback 404

**Check**:
```bash
# In Coolify env vars
BETTER_AUTH_URL=https://gadgetbot.vellandi.net  # Should NOT have trailing slash
```

**Fix**: Ensure `BETTER_AUTH_URL` matches exactly what's configured in Zitadel redirect URIs

### Issue 2: Zitadel Redirect URI Not Configured

**Symptom**: Zitadel error "redirect_uri mismatch"

**Check**: Zitadel OAuth app → Redirect URIs

**Fix**: Add `https://gadgetbot.vellandi.net/api/auth/callback/zitadel`

### Issue 3: CORS / Network Timeout

**Symptom**: Request hangs, no error in console

**Check**: Network tab shows request to Zitadel timing out

**Possible causes**:
- Zitadel container not accessible from gadgetbot container
- DNS resolution failing
- Firewall blocking outbound requests

**Fix**: Verify Zitadel is accessible from gadgetbot container:
```bash
# In gadgetbot container terminal
curl https://gadgetbot-auth.vellandi.net/.well-known/openid-configuration
```

### Issue 4: Database Tables Missing

**Symptom**: Error in logs about missing tables (users, sessions, accounts, verifications)

**Fix**: Run migrations
```bash
npm run db:migrate
```

### Issue 5: PKCE vs Client Secret Mismatch

**Symptom**: Token exchange fails during callback

**Check**:
- `src/auth/server.ts` has `pkce: true`
- Zitadel OAuth app allows PKCE

**Fix**: Either:
1. Enable PKCE in Zitadel and remove `ZITADEL_CLIENT_SECRET`
2. Disable PKCE in code and use client secret

---

## Testing OAuth Flow Manually

### Step 1: Test Authorization Endpoint

Visit this URL in browser (replace CLIENT_ID):
```
https://gadgetbot-auth.vellandi.net/oauth/v2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://gadgetbot.vellandi.net/api/auth/callback/zitadel&response_type=code&scope=openid+profile+email&code_challenge=test&code_challenge_method=S256
```

**Expected**: Should redirect to Zitadel login page (not error page)

### Step 2: Check OIDC Discovery

```bash
curl https://gadgetbot-auth.vellandi.net/.well-known/openid-configuration
```

**Expected**: JSON response with authorization_endpoint, token_endpoint, etc.

---

## Next Steps

If none of the above resolve the issue, collect:

1. **Browser console errors** (screenshot)
2. **Network tab** showing failed requests (screenshot)
3. **Application logs** from Coolify
4. **Environment variables** (sanitized - no secrets)
5. **Zitadel OAuth app settings** (screenshot)

Then we can dig deeper into the specific failure point.
