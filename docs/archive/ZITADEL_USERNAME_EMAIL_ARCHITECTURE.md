# Zitadel Username & Email Architecture

**Date**: 2025-11-01
**Based on**: Zitadel v4.x deployment investigation

---

## Executive Summary

Zitadel uses a **multi-layered identity system** where usernames, emails, and login identifiers are stored in separate tables. Understanding this architecture is crucial for properly configuring first-instance users and managing user identities.

---

## Core Identity Components

### 1. User ID
- **Format**: Numeric string (e.g., `344801573492818185`)
- **Location**: Primary key across all user tables
- **Immutable**: Never changes once user is created

### 2. Username
- **Purpose**: Primary login identifier
- **Location**: `projections.users14.username` and `projections.login_names3_users.user_name`
- **Can be changed**: Via UI or API (creates `user.username.changed` event)
- **Unique constraint**: Enforced in `eventstore.unique_constraints` (type: `usernames`)

### 3. Email
- **Purpose**: Contact email and optionally a login identifier
- **Location**: `projections.users14_humans.email`
- **Verification status**: `projections.users14_humans.is_email_verified`
- **Can be changed**: Via UI or API
- **Independent from username**: Can be different values

### 4. Organization Domain Suffix
- **Purpose**: Provides fully-qualified login names
- **Location**: `projections.login_names3_domains.name`
- **Format**: `{org_name}.{external_domain}` (e.g., `gadgetbot.auth.vellandi.net`)
- **Set during**: First instance initialization via `ZITADEL_FIRSTINSTANCE_ORG_NAME` and `ZITADEL_EXTERNALDOMAIN`

---

## Database Schema Deep Dive

### User Tables

#### `projections.users14` (Main User Record)
```sql
id                  | text      -- User ID (immutable)
username            | text      -- Primary login identifier
type                | smallint  -- 1 = human, 2 = machine
state               | smallint  -- 1 = active, 2 = inactive, etc.
resource_owner      | text      -- Organization ID
instance_id         | text      -- Instance ID
creation_date       | timestamp
change_date         | timestamp
sequence            | bigint
```

**Example**:
```sql
id: 344801573492818185
username: dev@vellandi.net
type: 1 (human)
state: 1 (active)
```

#### `projections.users14_humans` (Human User Details)
```sql
user_id               | text      -- Foreign key to users14.id
email                 | text      -- Contact email
is_email_verified     | boolean   -- Email verification status
first_name            | text
last_name             | text
phone                 | text
is_phone_verified     | boolean
password_change_required | boolean
-- ... other fields
```

**Example**:
```sql
user_id: 344801573492818185
email: dev@vellandi.net
is_email_verified: true
first_name: Mario
last_name: Vellandi
```

#### `projections.login_names3_users` (Login Name Index)
```sql
id                | text  -- User ID
user_name         | text  -- Username (same as users14.username)
user_name_lower   | text  -- Lowercase for case-insensitive lookup
resource_owner    | text  -- Organization ID
instance_id       | text  -- Instance ID
```

**Example**:
```sql
id: 344801573492818185
user_name: dev@vellandi.net
user_name_lower: dev@vellandi.net
```

#### `projections.login_names3_domains` (Organization Domain Suffix)
```sql
name           | text     -- Domain suffix
name_lower     | text     -- Lowercase for case-insensitive lookup
is_primary     | boolean  -- Is this the primary domain?
resource_owner | text     -- Organization ID
instance_id    | text     -- Instance ID
```

**Example**:
```sql
name: gadgetbot.auth.vellandi.net
is_primary: true
resource_owner: 344801573492293897 (GadgetBot org)
```

#### `projections.login_names3_policies` (Login Policy)
```sql
must_be_domain | boolean  -- Require domain suffix in login?
is_default     | boolean  -- Is this the default policy?
resource_owner | text     -- Scope (instance or org)
instance_id    | text     -- Instance ID
```

**Example**:
```sql
must_be_domain: false
is_default: true
```

**Impact**: When `must_be_domain = false`, Zitadel accepts login in multiple formats:
- Short form: `dev@vellandi.net`
- Full form: `dev@vellandi.net@gadgetbot.auth.vellandi.net`

---

### Membership Tables

#### `projections.instance_members4`
```sql
user_id            | text     -- User ID
roles              | text[]   -- Array of instance roles
user_resource_owner| text     -- User's organization
resource_owner     | text     -- Instance ID
instance_id        | text     -- Instance ID
```

**Example**:
```sql
user_id: 344801573492818185
roles: {IAM_OWNER}  -- Instance admin
```

#### `projections.org_members4`
```sql
user_id            | text     -- User ID
roles              | text[]   -- Array of org roles
user_resource_owner| text     -- User's organization
resource_owner     | text     -- Organization ID
instance_id        | text     -- Instance ID
```

**Example**:
```sql
user_id: 344801573492818185
roles: {ORG_OWNER}  -- Organization admin
```

---

### Event Sourcing Tables

#### `eventstore.events2` (Audit Log)
```sql
instance_id     | text
aggregate_type  | text      -- e.g., 'user'
aggregate_id    | text      -- User ID for user events
event_type      | text      -- e.g., 'user.username.changed'
sequence        | bigint
payload         | jsonb     -- Event data
created_at      | timestamp
creator         | text      -- Who triggered the event
```

**Key Events**:
- `user.human.added` - User creation (includes initial username)
- `user.username.changed` - Username update
- `user.human.email.changed` - Email update
- `user.human.email.verified` - Email verification
- `user.human.password.check.succeeded` - Successful login

**Example Event**:
```sql
event_type: user.username.changed
created_at: 2025-11-01 17:02:38
payload: {"userName": "dev@vellandi.net"}
```

**Historical Data**:
```sql
-- Initial user creation
event_type: user.human.added
payload: {
  "userName": "admin@gadgetbot.auth.vellandi.net",
  "email": "admin@gadgetbot.auth.vellandi.net",
  "firstName": "Mario",
  "lastName": "Vellandi"
}

-- Later username change
event_type: user.username.changed
payload: {"userName": "dev@vellandi.net"}
```

#### `eventstore.unique_constraints` (Uniqueness Enforcement)
```sql
instance_id    | text
unique_type    | text    -- e.g., 'usernames', 'member'
unique_field   | text    -- The value that must be unique
```

**Example**:
```sql
unique_type: usernames
unique_field: dev@vellandi.net
```

**Purpose**: Ensures no two users can have the same username within an instance.

---

## Login Resolution Algorithm

Based on the database investigation, here's how Zitadel resolves login names:

### Step 1: Check Login Policy
```sql
SELECT must_be_domain
FROM projections.login_names3_policies
WHERE is_default = true;
```

If `must_be_domain = false`, accept both short and full formats.

### Step 2: Parse Login Input
Given input: `admin@gadgetbot.auth.vellandi.net`

Zitadel checks:
1. **Exact match**: Does this match any `login_names3_users.user_name`?
2. **Domain suffix resolution**: Does this match `{username}@{org_domain}`?
   - Extract potential username: `admin`
   - Check if `gadgetbot.auth.vellandi.net` exists in `login_names3_domains`
   - If yes, look for user with username = `admin`

### Step 3: User Lookup
```sql
-- Direct username match
SELECT id FROM projections.login_names3_users
WHERE user_name_lower = lower('dev@vellandi.net');

-- Domain suffix resolution (if policy allows)
-- Check if input matches: username@org_domain format
-- Then lookup: SELECT id WHERE user_name_lower = lower('admin')
```

### Why Old Username Still Works

**Theory**: When you log in with `admin@gadgetbot.auth.vellandi.net`, Zitadel may be:

1. **Parsing it as**: `admin` + `@gadgetbot.auth.vellandi.net`
2. **Checking**: Is `gadgetbot.auth.vellandi.net` a valid org domain? (Yes)
3. **Looking for**: A user with username = `admin` in that org
4. **Not finding exact match**: But finding your user via email match or other fallback

**Alternative Theory**: Email-based login fallback
- Your initial email was `admin@gadgetbot.auth.vellandi.net`
- We only updated `users14_humans.email`, not cleared any email-based login caches
- Zitadel might allow login with verified email addresses as an alternative

**To Test**: Check if email can be used as login identifier:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name LIKE '%login%';
```

---

## First Instance Creation Process

### Environment Variables (docker-compose.yml)
```yaml
ZITADEL_FIRSTINSTANCE_ORG_NAME: GadgetBot
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME: admin
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORD: Admin123!
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL_VERIFIED: true
ZITADEL_EXTERNALDOMAIN: auth.vellandi.net
```

### What Gets Created

1. **Organization** (`projections.orgs1`):
   ```sql
   id: 344801573492293897
   name: GadgetBot
   ```

2. **Organization Domain** (`projections.login_names3_domains`):
   ```sql
   name: gadgetbot.auth.vellandi.net
   -- Format: {org_name_lowercase}.{external_domain}
   ```

3. **User** (`projections.users14`):
   ```sql
   id: 344801573492818185
   username: admin@gadgetbot.auth.vellandi.net
   -- Format: {username}@{org_domain}
   ```

4. **Human Details** (`projections.users14_humans`):
   ```sql
   user_id: 344801573492818185
   email: admin@gadgetbot.auth.vellandi.net
   is_email_verified: true
   ```

5. **Memberships**:
   ```sql
   -- Instance admin
   INSERT INTO projections.instance_members4
   VALUES (user_id, {IAM_OWNER});

   -- Organization admin
   INSERT INTO projections.org_members4
   VALUES (user_id, {ORG_OWNER});
   ```

### Critical Insights

**1. The `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME` is misleading!**

Despite being named "username", Zitadel actually creates:
```
username = {value}@{org_name_lower}.{external_domain}
```

So:
- Input: `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin`
- Actual username: `admin@gadgetbot.auth.vellandi.net`

This is **not documented clearly** in Zitadel's official docs.

**2. ⚠️ CRITICAL: `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL` is IGNORED!**

**Discovery Date**: 2025-11-01

Zitadel **ignores** the `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL` environment variable and instead **auto-generates the email** to match the username format.

**Evidence from production deployment**:
- Environment variable set: `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin`
- Environment variable set: `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL=dev@vellandi.net`
- Actual username created: `admin@gadgetbot.auth.vellandi.net` (transformed from "admin")
- Actual email created: `admin@gadgetbot.auth.vellandi.net` (ignored `dev@vellandi.net`)
- Confirmed via `docker inspect` and `eventstore.events2` audit log

**Implication**: You **cannot** set a custom email during first instance initialization. The email will always be:
```
email = {username}@{org_name_lower}.{external_domain}
```

**Workaround**: 
After deployment, manually change the email via:
- Zitadel Console UI (requires SMTP for verification)
- Direct PostgreSQL update (bypass verification):
  ```sql
  UPDATE projections.users14_humans
  SET email = 'your-desired-email@example.com',
      is_email_verified = true
  WHERE user_id = '<user_id>';
  ```

---

## How to Change Username and Email

### Option 1: Via Zitadel Console UI
1. Log into console: https://auth.vellandi.net/ui/console
2. Navigate to: Users → Click user → Edit
3. Change "Username" field
4. Change "Email" field separately
5. Email verification required (unless SMTP not configured, then stays unverified)

**Limitation**: Cannot verify email without SMTP configured.

**⚠️ Note on Username Changes**: After changing username via Console UI, the **old username may still work for login** despite not appearing in the database projections.

**Evidence** (tested 2025-11-01):
- Changed username from `admin@gadgetbot.auth.vellandi.net` to `dev@vellandi.net`
- Database shows only `dev@vellandi.net` in all projection tables
- **But**: Login with `admin@gadgetbot.auth.vellandi.net` still succeeds (tested in private browser)
- Theory: Zitadel's login resolver may use organization domain matching as a fallback

This appears to be an undocumented feature or side effect of Zitadel's login name resolution algorithm.

### Option 2: Via PostgreSQL (Manual Update)

**⚠️ Warning**: This bypasses Zitadel's validation and event sourcing. Use only when necessary.

#### Change Email:
```sql
UPDATE projections.users14_humans
SET email = 'new-email@example.com',
    is_email_verified = true
WHERE user_id = '344801573492818185';
```

#### Change Username:
```sql
-- 1. Update main user table
UPDATE projections.users14
SET username = 'new-username'
WHERE id = '344801573492818185';

-- 2. Update login names index
UPDATE projections.login_names3_users
SET user_name = 'new-username',
    user_name_lower = lower('new-username')
WHERE id = '344801573492818185';

-- 3. Update unique constraint
UPDATE eventstore.unique_constraints
SET unique_field = 'new-username'
WHERE unique_type = 'usernames'
AND unique_field = 'old-username';

-- 4. Insert event for audit trail (optional but recommended)
-- Note: This is complex and best done via Zitadel API
```

**Recommended**: Only change email manually. Change username via UI to ensure proper event sourcing.

---

## Recommendations for Deployment

### Problem: Current Default Username is Ugly

**Current behavior**:
- `ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin`
- Creates username: `admin@gadgetbot.auth.vellandi.net`

**Why this is bad**:
- Long and confusing
- Looks like an email but isn't
- Redundant with the actual email field
- Users expect simple usernames like "admin"

### Solution 1: Use Email as Username (Recommended)

**Best Practice**: Set username equal to your desired email address.

```yaml
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME: dev@vellandi.net
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL: dev@vellandi.net
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL_VERIFIED: true
```

**Result**:
- Username: `dev@vellandi.net@gadgetbot.auth.vellandi.net`
- Email: `dev@vellandi.net`
- Login: `dev@vellandi.net` (short form works with `must_be_domain=false`)

**Pros**:
- Login with just your email address
- Clear and professional
- Matches user expectations

**Cons**:
- Internal username still has domain suffix (but users won't see it)

### Solution 2: Change Username Post-Deployment

**Workflow**:
1. Deploy with any username (e.g., `admin`)
2. Log into console
3. Navigate to user profile
4. Change username to desired value (e.g., `dev@vellandi.net`)
5. Username constraint updated automatically

**Pros**:
- Full control over final username
- Proper event sourcing
- Can verify everything works first

**Cons**:
- Extra manual step after deployment

### Solution 3: Configure Organization to Not Require Domain Suffix

**Not Recommended**: Zitadel's domain suffix provides namespace isolation for multi-org instances. Disabling it can cause username conflicts.

---

## Configuration Export/Import Considerations

When using `npm run zitadel:export` and `npm run zitadel:import`:

### What Gets Exported
- Organization configuration
- Applications (OAuth clients)
- Roles and permissions
- Projects

### What Does NOT Get Exported
- **Users**: User data is not included in exports
- **Passwords**: Never exported for security
- **Sessions**: Ephemeral data

### Implication for New Deployments

When deploying to a new environment:
1. Run `zitadel:import` to configure org/apps
2. **First admin user must be created via `FIRSTINSTANCE` env vars**
3. Username will follow the `{username}@{org_domain}` pattern
4. Consider changing username post-deployment to desired format

---

## Testing Login Formats

To verify which login formats work, test these inputs:

### Current Username: `dev@vellandi.net`

**Expected to work**:
- ✅ `dev@vellandi.net` (short form, if `must_be_domain=false`)
- ✅ `dev@vellandi.net@gadgetbot.auth.vellandi.net` (full form)

**May work (needs verification)**:
- ❓ `admin@gadgetbot.auth.vellandi.net` (old username - currently works)
- ❓ Email address as login identifier (if Zitadel allows email-based login)

### How to Test via SQL

Check current login policy:
```sql
SELECT must_be_domain, is_default
FROM projections.login_names3_policies;
```

Check organization domains:
```sql
SELECT name, is_primary
FROM projections.login_names3_domains
WHERE resource_owner = '344801573492293897';
```

Check user login names:
```sql
SELECT user_name
FROM projections.login_names3_users
WHERE id = '344801573492818185';
```

---

## Summary

### Key Takeaways

1. **Username ≠ Email**: Separate fields with different purposes
2. **Domain Suffixes**: Automatically appended during first-instance creation
3. **Login Flexibility**: `must_be_domain=false` allows short-form logins
4. **Event Sourcing**: All changes logged in `eventstore.events2`
5. **Manual Updates**: Possible but bypass event sourcing (use with caution)

### Best Practice for New Deployments

```yaml
# Use email-like username for clean login experience
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME: admin@yourdomain.com
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL: admin@yourdomain.com
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL_VERIFIED: true

# Keep domain suffix policy flexible
# (This is the default, no need to set explicitly)
```

**Result**: Users can log in with `admin@yourdomain.com` and it works seamlessly.

---

## Production Deployment Findings

**Date**: 2025-11-07
**Environment**: Hetzner production server (Coolify deployment)

### Actual Production Database State

Queried the production Zitadel database directly:

```sql
SELECT u.id, u.username, h.email, h.display_name, u.state, u.type
FROM projections.users14 u
LEFT JOIN projections.users14_humans h ON u.id = h.user_id
ORDER BY u.creation_date;
```

**Results**:
```
id                 | username                                      | email                                         | display_name  | state | type
-------------------+-----------------------------------------------+-----------------------------------------------+---------------+-------+------
345523391233066499 | zitadel-admin@zitadel.gadgetbot-auth.vell...  | zitadel-admin@zitadel.gadgetbot-auth.vell...  | ZITADEL Admin |     1 |    1
345523391233132035 | login-client                                  |                                               |               |     1 |    2
```

### Key Findings

1. **Initial Admin User**:
   - **Username (loginname)**: `zitadel-admin@zitadel.auth.vellandi.net`
   - **Email**: `zitadel-admin@zitadel.auth.vellandi.net`
   - **Display Name**: `ZITADEL Admin`
   - **Type**: 1 (human)
   - **State**: 1 (active)

2. **Service Account**:
   - **Username**: `login-client`
   - **Type**: 2 (machine/service account)
   - **No email**: Service accounts don't have email addresses

3. **Organization**:
   ```sql
   SELECT id, name, primary_domain FROM projections.orgs1;
   ```

   **Result**:
   ```
   id                 | name    | primary_domain
   -------------------+---------+------------------------------------
   345523391232542211 | ZITADEL | zitadel.auth.vellandi.net
   ```

### Production Login Credentials

For fresh Zitadel production deployments, the **loginname** for the initial admin user is:

```
zitadel-admin@zitadel.auth.vellandi.net
```

**Password**: When not specified in environment variables, Zitadel uses the default password:

```
Password1!
```

**⚠️ Security Note**: The default password `Password1!` should be changed immediately after first login.

This follows the pattern:
```
{ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME}@{org_name_lower}.{ZITADEL_EXTERNALDOMAIN}
```

**Environment variables analysis** (from zitadel/docker-compose.production.yml):

The production deployment used Zitadel's default values when these environment variables were **not set**:

```yaml
# What was set:
ZITADEL_EXTERNALDOMAIN: auth.vellandi.net
ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORDCHANGEREQUIRED: false

# What was NOT set (so Zitadel used defaults):
# ZITADEL_FIRSTINSTANCE_ORG_NAME: (default: "ZITADEL")
# ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME: (default: "zitadel-admin")
# ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORD: (default: "Password1!")
# ZITADEL_FIRSTINSTANCE_ORG_HUMAN_EMAIL: (auto-generated from username)
```

**Evidence from database**:
```sql
-- User creation event payload:
SELECT event_type, payload FROM eventstore.events2
WHERE aggregate_id = '345523391233066499' AND event_type = 'user.human.added';

-- Shows encodedHash (bcrypt) was set during user creation
-- This confirms a password was set using Zitadel's default
```

### Database Access Commands

For future reference, here are the exact commands used to access production data:

**SSH into server**:
```bash
ssh hetzner-gadgetbot
```

**List Docker containers**:
```bash
docker ps --filter name=zitadel
docker ps --filter name=db
```

**Query database** (use the db container, not zitadel container):
```bash
# Note: Container name format is db-{coolify-id}
docker exec db-poo88s8sskwgogwwkgkgk8k4 psql -U postgres -d zitadel -c "YOUR_SQL_QUERY"
```

**Important**: The Zitadel container is distroless and doesn't have shell/psql. Always use the separate PostgreSQL container.

### Post-Deployment Notes

**Email Verification Status**:
- After updating admin user details (username, email) in Zitadel Console, the email may show as "not verified"
- This is **cosmetic only** and doesn't affect authentication functionality
- Admin can still log in, manage users, and configure OAuth applications
- **Do not** manually update the database to change verification status (risky due to event sourcing)
- If email verification is needed, configure SMTP in Zitadel and use the built-in verification flow

---

## Next Steps

1. ✅ **Documented production state**: Updated this file with actual production findings
2. ✅ **Production login successful**: Confirmed with default password `Password1!`
3. ✅ **Admin password changed**: Set secure password after first login
4. ✅ **Admin details updated**: Username and email configured
5. **Create OAuth application for GadgetBot**: Follow documented process in AUTH_SETUP.md

---

## References

- Database investigation: 2025-11-01 (initial), 2025-11-07 (production)
- Zitadel version: v4.x (latest, ghcr.io/zitadel/zitadel:latest)
- PostgreSQL schema: Inspected via `psql` on production instance (Hetzner)
- Event sourcing: Analyzed `eventstore.events2` for user lifecycle
- Production deployment: Coolify on Hetzner Cloud
- Database container: Managed by Coolify (separate from Zitadel container)
