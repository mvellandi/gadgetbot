# Zitadel 3-Container Setup Testing Plan

## Status: In Progress
**Branch**: `experiment/zitadel-official-setup`

---

## Progress Summary

### ✅ Completed

1. **Official Setup Downloaded**
   - Downloaded official docker-compose.yaml from Zitadel docs
   - Created `docker-compose.zitadel-official.yml` (unmodified reference)
   - Created `docker-compose.zitadel-test.yml` (customized for GadgetBot)

2. **3-Container Architecture Working**
   - ✅ Zitadel API container (port 8080)
   - ✅ Login V2 UI container (port 3000)
   - ✅ PostgreSQL database (internal)
   - All containers healthy and communicating

3. **First Instance Configuration**
   - Organization: GadgetBot
   - Admin user: `admin@gadgetbot.localhost` / `Admin123!`
   - Login V2 enabled and tested

4. **Import Script Fixed**
   - Handles existing projects (409 conflicts)
   - Fetches existing project IDs via search API
   - Infers project from clientId suffix (@gadgetbot, @zitadel)
   - Successfully imported GadgetBot configuration (2 projects, 5 applications)

### 🔄 Current Status

**Local Environment:**
- 3-container Zitadel setup running
- Configuration imported successfully
- Ready for OAuth integration testing

---

## Local Testing Plan

### Phase 1: OAuth Integration ⏳ NEXT

**Goal:** Verify GadgetBot app can authenticate with 3-container Zitadel

**Prerequisites:**
- [x] Zitadel running (`docker ps` shows 3 healthy containers)
- [x] GadgetBot project and application imported
- [ ] Get new Client ID from Console

**Steps:**

1. **Get Client ID from Zitadel Console**
   ```bash
   # Open browser
   open http://localhost:8080/ui/console

   # Login as: admin@GadgetBot.localhost / Admin123!
   # Navigate to: Projects → GadgetBot → Applications → GadgetBot Web
   # Copy the Client ID (format: xxxxx@gadgetbot)
   ```

2. **Update .env with New Client ID**
   ```bash
   # In .env file
   ZITADEL_CLIENT_ID=<new-client-id>@gadgetbot
   ZITADEL_ISSUER_URL=http://localhost:8080
   ```

3. **Start GadgetBot Application**
   ```bash
   npm run dev
   ```

4. **Test Login Flow**
   - Navigate to http://localhost:3000
   - Click "Sign In"
   - **Expected**: Redirect to Login V2 at http://localhost:3000/ui/v2/login
   - Login with test user
   - **Expected**: Redirect back to app, authenticated

5. **Verify Session**
   - Check user info displays correctly
   - Test protected routes
   - Test sign out

**Success Criteria:**
- ✅ Redirect to Login V2 UI (modern interface)
- ✅ Authentication successful
- ✅ User session persists
- ✅ Sign out works correctly

---

### Phase 2: Login V2 Features Testing

**Goal:** Verify Login V2 provides enhanced features vs Login V1

**Features to Test:**

1. **Modern UI**
   - Clean, updated design
   - Responsive layout
   - Dark mode support (if configured)

2. **Enhanced Security**
   - PKCE flow working
   - Session management
   - Proper token handling

3. **User Experience**
   - Password reset flow
   - Account selection (if multiple accounts)
   - Error messaging

**Success Criteria:**
- ✅ Login V2 UI loads correctly
- ✅ All auth flows work smoothly
- ✅ No console errors

---

### Phase 3: Export/Import Roundtrip Test

**Goal:** Verify export/import maintains configuration integrity

**Steps:**

1. **Make Changes in Console**
   - Add a new role to GadgetBot project
   - Update redirect URIs
   - Add a new application

2. **Export Configuration**
   ```bash
   export ZITADEL_SERVICE_TOKEN=<token>
   npm run zitadel:export -- --output=test-export.json
   ```

3. **Reset Zitadel**
   ```bash
   npm run zitadel:down -v
   npm run zitadel:up
   ```

4. **Import Configuration**
   ```bash
   npm run zitadel:import -- --input=test-export.json
   ```

5. **Verify in Console**
   - All projects present
   - All applications present
   - Roles and grants preserved

**Success Criteria:**
- ✅ Export captures all changes
- ✅ Import recreates configuration accurately
- ✅ App continues to work after import

---

## Production Testing Plan

### Phase 1: Evaluate 3-Container vs Single-Container for Production

**Decision Factors:**

| Aspect | Single-Container | 3-Container |
|--------|-----------------|-------------|
| **Complexity** | ✅ Simple | ⚠️ More complex |
| **Login V2** | ❌ Not supported | ✅ Supported |
| **Resource Usage** | ✅ Lower | ⚠️ Higher |
| **Maintenance** | ✅ Easier | ⚠️ Harder |
| **Features** | ⚠️ Login V1 only | ✅ Full feature set |
| **Coolify Support** | ✅ Easy | ⚠️ Requires Docker Image deployment |

**Questions to Answer:**
1. Do we need Login V2 features for production?
2. Is the added complexity worth it?
3. Can we handle 3 containers in Coolify?

**Testing Approach:**
- Test both setups locally first
- Compare user experience
- Evaluate maintenance burden
- Make informed decision

---

### Phase 2: Coolify Deployment (If Going with 3-Container)

**Preparation:**

1. **Update docker-compose.zitadel-prod.yml**
   - Base it on `docker-compose.zitadel-test.yml`
   - Add login-ui service
   - Configure for external domain
   - Update environment variables for production

2. **Create Deployment Documentation**
   - Update `ZITADEL_COOLIFY_COMPOSE.md`
   - Document 3-container specific steps
   - Add troubleshooting for Login V2

**Deployment Steps:**

1. **Deploy to Coolify**
   - Use Docker Image deployment (not Docker Compose)
   - Deploy database first
   - Deploy Zitadel API
   - Deploy Login V2 UI

2. **Configure Networking**
   - Ensure containers can communicate
   - Set up reverse proxy for both ports (8080, 3000)
   - Configure domain/SSL

3. **Import Configuration**
   ```bash
   # SSH to Coolify server
   # Run import script in Zitadel container
   docker exec -it <zitadel-container> npm run zitadel:import
   ```

4. **Update App Environment**
   - Set production Client ID
   - Set production Issuer URL
   - Update redirect URIs in Zitadel Console

5. **Test Production Auth Flow**
   - Test sign in
   - Test sign out
   - Verify sessions work
   - Check error handling

---

## Fallback Plan

If 3-container setup proves too complex for production:

1. **Stick with Single-Container**
   - Keep `docker-compose.zitadel-prod.yml` as-is
   - Continue using Login V1
   - Maintain simpler deployment

2. **Document Tradeoffs**
   - Note Login V2 is not available
   - List any missing features
   - Plan for future migration if needed

3. **Use 3-Container for Development Only**
   - Local dev gets Login V2
   - Production stays simple
   - Good for testing new features

---

## Key Files

**Compose Files:**
- `docker-compose.zitadel-official.yml` - Unmodified official example (reference)
- `docker-compose.zitadel-test.yml` - Local 3-container setup (GadgetBot customized)
- `docker-compose.zitadel.yml` - Current single-container local (baseline)
- `docker-compose.zitadel-prod.yml` - Current production config (single-container)

**Scripts:**
- `scripts/zitadel-import.ts` - Enhanced import with 3-container support
- `scripts/zitadel-export.ts` - Export configuration

**Documentation:**
- `docs/ZITADEL_MIGRATION.md` - Import/export guide (updated)
- `docs/ZITADEL_DEPLOYMENT_NOTES.md` - Deployment findings
- `docs/ZITADEL_COOLIFY_COMPOSE.md` - Coolify deployment guide
- `ZITADEL_3CONTAINER_TESTING_PLAN.md` - This file

---

## Next Steps

1. **Immediate: Test OAuth with Local 3-Container Setup**
   - Get Client ID from Console
   - Update .env
   - Test login flow
   - Verify Login V2 UI works

2. **Short-term: Complete Local Testing**
   - Test all auth flows
   - Document any issues
   - Compare UX with single-container

3. **Decision Point: Production Approach**
   - Based on local testing results
   - Evaluate complexity vs benefits
   - Choose single or 3-container for production

4. **If 3-Container: Update Production Configs**
   - Create production compose file
   - Update deployment docs
   - Plan Coolify deployment

5. **If Single-Container: Document Reasons**
   - Note why Login V2 wasn't needed
   - Keep 3-container for dev/testing
   - Revisit in future if requirements change

---

## Questions to Answer During Testing

1. **Performance**: Is there noticeable difference in auth speed?
2. **UX**: Does Login V2 provide significantly better user experience?
3. **Reliability**: Are 3 containers more or less stable than 1?
4. **Deployment**: How much harder is Coolify deployment with 3 containers?
5. **Maintenance**: Is the added complexity worth the features?

---

## Success Metrics

**Local Testing:**
- All auth flows work correctly
- No regressions vs single-container
- Login V2 features accessible

**Production Decision:**
- Clear understanding of tradeoffs
- Documented reasoning for approach chosen
- Tested plan for chosen approach

**Final State:**
- Production authentication working reliably
- Clear documentation for future maintenance
- Ability to migrate between approaches if needed
