## 1. Dependencies and Configuration

- [x] 1.1 Add `authlib` and `httpx` to requirements.txt
- [x] 1.2 Add Google OAuth settings to `app/config.py` (google_client_id, google_client_secret, google_redirect_uri)
- [x] 1.3 Create `.env.example` update documenting required OAuth environment variables

## 2. Database Schema

- [x] 2.1 Add `google_id` column (nullable, unique, indexed) to User model in `app/models/user.py`
- [x] 2.2 Make `hashed_password` column nullable in User model
- [x] 2.3 Create Alembic migration for schema changes
- [x] 2.4 Test migration applies cleanly and rolls back without data loss

## 3. Schemas

- [x] 3.1 Add `GoogleAuthResponse` schema with authorization_url field in `app/schemas/user.py`
- [x] 3.2 Add `GoogleCallbackRequest` schema for callback query parameters
- [x] 3.3 Add `GoogleLinkResponse` schema for link confirmation

## 4. OAuth Service

- [x] 4.1 Create `app/services/oauth.py` with Google OAuth client setup using authlib
- [x] 4.2 Implement `get_authorization_url()` returning Google OAuth URL with state and PKCE
- [x] 4.3 Implement `exchange_code_for_tokens()` to exchange authorization code for Google tokens
- [x] 4.4 Implement `verify_google_token()` to validate and extract user info from ID token
- [x] 4.5 Implement `is_oauth_configured()` helper to check if credentials are set

## 5. Auth Service Updates

- [x] 5.1 Add `get_or_create_oauth_user()` method to handle new user creation and email-based linking
- [x] 5.2 Add `link_google_account()` method for authenticated user linking
- [x] 5.3 Add `find_user_by_google_id()` method to UserRepository
- [x] 5.4 Update `login()` to handle OAuth-only users (no password set)

## 6. Router Endpoints

- [x] 6.1 Add `GET /auth/google` endpoint to initiate OAuth flow
- [x] 6.2 Add `GET /auth/google/callback` endpoint to handle OAuth callback
- [x] 6.3 Add `GET /auth/google/link` endpoint for authenticated users to initiate account linking
- [x] 6.4 Add `GET /auth/google/link/callback` endpoint to complete account linking
- [x] 6.5 Add 503 response handling when OAuth is not configured

## 7. Unit Tests

- [x] 7.1 Test `get_authorization_url()` returns valid URL with state and PKCE parameters
- [x] 7.2 Test new user creation via OAuth callback
- [x] 7.3 Test existing user auto-linking via email match
- [x] 7.4 Test existing Google-linked user sign-in
- [x] 7.5 Test invalid state parameter returns 400
- [x] 7.6 Test invalid authorization code returns 401
- [x] 7.7 Test Google ID takes precedence over email in conflict scenarios
- [x] 7.8 Test account linking for authenticated user
- [x] 7.9 Test linking fails when Google account already linked to another user
- [x] 7.10 Test linking fails when user already has a linked Google account
- [x] 7.11 Test OAuth-only user cannot login with password
- [x] 7.12 Test 503 response when OAuth credentials not configured

## 8. Integration Tests

- [x] 8.1 Test full OAuth flow with mocked Google responses
- [x] 8.2 Test token issuance after successful OAuth authentication
- [x] 8.3 Test existing email/password auth still works after changes
