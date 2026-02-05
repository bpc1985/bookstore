## ADDED Requirements

### Requirement: Initiate Google OAuth flow

The system SHALL provide an endpoint to initiate Google OAuth 2.0 authorization. The endpoint SHALL return a Google authorization URL with PKCE code challenge and state parameter for CSRF protection.

#### Scenario: Successfully initiate OAuth flow
- **WHEN** client sends GET request to `/auth/google`
- **THEN** system returns 200 with JSON containing `authorization_url` pointing to Google's OAuth consent screen
- **AND** the URL includes `state` parameter for CSRF protection
- **AND** the URL includes PKCE `code_challenge` parameter

#### Scenario: OAuth not configured
- **WHEN** client sends GET request to `/auth/google`
- **AND** Google OAuth credentials are not configured
- **THEN** system returns 503 Service Unavailable with error message indicating OAuth is not configured

### Requirement: Handle Google OAuth callback

The system SHALL provide a callback endpoint that exchanges the authorization code for Google tokens, verifies the user identity, and issues JWT tokens.

#### Scenario: New user signs in with Google
- **WHEN** Google redirects to `/auth/google/callback` with valid `code` and `state` parameters
- **AND** the Google account email does not exist in the database
- **THEN** system creates a new user account with the Google email and name
- **AND** system links the Google account ID to the user
- **AND** system returns JWT access and refresh tokens

#### Scenario: Existing password user signs in with Google (auto-link)
- **WHEN** Google redirects to `/auth/google/callback` with valid `code` and `state` parameters
- **AND** the Google account email matches an existing user without a linked Google account
- **THEN** system links the Google account ID to the existing user
- **AND** system returns JWT access and refresh tokens

#### Scenario: Existing Google-linked user signs in
- **WHEN** Google redirects to `/auth/google/callback` with valid `code` and `state` parameters
- **AND** the Google account ID is already linked to a user
- **THEN** system returns JWT access and refresh tokens for the linked user

#### Scenario: Invalid state parameter (CSRF protection)
- **WHEN** Google redirects to `/auth/google/callback` with a `state` parameter that does not match the session
- **THEN** system returns 400 Bad Request with error indicating invalid state

#### Scenario: Invalid authorization code
- **WHEN** Google redirects to `/auth/google/callback` with an invalid or expired `code`
- **THEN** system returns 401 Unauthorized with error indicating authentication failed

#### Scenario: Google account email already linked to different user
- **WHEN** Google redirects to `/auth/google/callback` with valid parameters
- **AND** the Google account ID is linked to user A
- **AND** the Google email matches a different user B
- **THEN** system authenticates as user A (Google ID takes precedence over email)

### Requirement: Link Google account for authenticated user

The system SHALL allow authenticated users to explicitly link their Google account via a dedicated endpoint.

#### Scenario: Successfully link Google account
- **WHEN** authenticated user initiates Google OAuth via `/auth/google/link`
- **AND** completes Google authorization
- **AND** the Google account is not linked to any other user
- **THEN** system links the Google account ID to the authenticated user
- **AND** system returns success response

#### Scenario: Google account already linked to another user
- **WHEN** authenticated user attempts to link a Google account
- **AND** the Google account ID is already linked to a different user
- **THEN** system returns 409 Conflict with error indicating the Google account is already in use

#### Scenario: User already has a linked Google account
- **WHEN** authenticated user attempts to link a Google account
- **AND** the user already has a different Google account linked
- **THEN** system returns 409 Conflict with error indicating user already has a linked Google account

### Requirement: OAuth-only user authentication

The system SHALL support users who only authenticate via Google OAuth and have no password set.

#### Scenario: OAuth-only user cannot use password login
- **WHEN** OAuth-only user (no password) attempts to login via `/auth/login` with email and any password
- **THEN** system returns 401 Unauthorized with error indicating invalid credentials

#### Scenario: OAuth-only user can sign in via Google
- **WHEN** OAuth-only user authenticates via Google OAuth
- **THEN** system returns JWT access and refresh tokens

### Requirement: Google OAuth configuration

The system SHALL require Google OAuth credentials to be configured via environment variables.

#### Scenario: Configuration via environment variables
- **WHEN** system starts with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables set
- **THEN** Google OAuth endpoints are enabled and functional

#### Scenario: Missing configuration disables OAuth
- **WHEN** system starts without Google OAuth credentials configured
- **THEN** Google OAuth endpoints return 503 Service Unavailable
- **AND** existing email/password authentication continues to function normally
