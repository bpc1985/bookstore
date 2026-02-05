## Why

Users currently must create a dedicated account with email/password to use the bookstore. Adding Google OAuth provides a faster, more convenient sign-in option that reduces friction and leverages existing trusted identities.

## What Changes

This is a **backend-only** change (`be-` prefix) affecting `apps/backend/`.

- Add Google OAuth 2.0 authentication flow with authorization code exchange
- New API endpoints for initiating OAuth and handling callbacks
- Extend User model to support OAuth-linked accounts (optional `google_id`)
- Support both new user registration and existing user account linking via Google
- Users signing in with Google for the first time get an account created automatically
- Existing users can link their Google account for faster login
- Password remains optional for OAuth-only users

## Capabilities

### New Capabilities

- `google-oauth`: Google OAuth 2.0 sign-in flow including authorization redirect, callback handling, token exchange, and automatic account creation/linking

### Modified Capabilities

None - no existing specs to modify.

## Impact

**Code changes:**
- `app/models/user.py` - Add `google_id` column (nullable)
- `app/schemas/user.py` - Add OAuth-related request/response schemas
- `app/routers/auth.py` - Add `/auth/google` and `/auth/google/callback` endpoints
- `app/services/auth.py` - Add OAuth authentication logic
- `app/config.py` - Add Google OAuth credentials configuration

**Database:**
- New migration adding `google_id` column to `users` table

**Dependencies:**
- Add `google-auth` or `authlib` for OAuth token verification

**External:**
- Requires Google Cloud Console OAuth 2.0 credentials (client ID, client secret)
- Configured redirect URI must match deployment URL
