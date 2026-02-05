## ADDED Requirements

### Requirement: Google sign-in button on login page

The login page SHALL display a "Sign in with Google" button that initiates the Google OAuth flow.

#### Scenario: User clicks Google sign-in button
- **WHEN** user clicks the "Sign in with Google" button on the login page
- **THEN** button shows loading state
- **AND** system fetches the Google authorization URL from the backend
- **AND** browser redirects to Google's OAuth consent screen

#### Scenario: Google sign-in button shows error when OAuth not configured
- **WHEN** user clicks the "Sign in with Google" button
- **AND** backend returns 503 (OAuth not configured)
- **THEN** system displays toast notification "Google sign-in is not available"
- **AND** button returns to idle state

#### Scenario: Google sign-in button shows error on network failure
- **WHEN** user clicks the "Sign in with Google" button
- **AND** network request fails
- **THEN** system displays toast notification "Unable to connect. Please try again."
- **AND** button returns to idle state

### Requirement: Google sign-up button on registration page

The registration page SHALL display a "Sign up with Google" button that initiates the Google OAuth flow.

#### Scenario: User clicks Google sign-up button
- **WHEN** user clicks the "Sign up with Google" button on the registration page
- **THEN** button shows loading state
- **AND** system fetches the Google authorization URL from the backend
- **AND** browser redirects to Google's OAuth consent screen

### Requirement: OAuth callback page handles token exchange

The frontend SHALL provide a callback page at `/auth/google/callback` that completes the OAuth flow.

#### Scenario: Successful OAuth callback
- **WHEN** Google redirects to `/auth/google/callback` with valid `code` and `state` query parameters
- **THEN** callback page displays loading indicator
- **AND** system exchanges the code for JWT tokens via backend API
- **AND** system stores access and refresh tokens in auth store
- **AND** system fetches and stores current user profile
- **AND** browser redirects to home page

#### Scenario: OAuth callback with invalid state
- **WHEN** Google redirects to `/auth/google/callback`
- **AND** backend returns 400 (invalid state)
- **THEN** system displays toast notification "Sign-in failed. Please try again."
- **AND** browser redirects to login page

#### Scenario: OAuth callback with invalid code
- **WHEN** Google redirects to `/auth/google/callback`
- **AND** backend returns 401 (invalid or expired code)
- **THEN** system displays toast notification "Sign-in failed. Please try again."
- **AND** browser redirects to login page

#### Scenario: OAuth callback with missing parameters
- **WHEN** user navigates directly to `/auth/google/callback` without query parameters
- **THEN** browser redirects to login page

### Requirement: Auth store supports Google OAuth login

The auth Zustand store SHALL provide a method to complete Google OAuth authentication.

#### Scenario: loginWithGoogle stores tokens and user
- **WHEN** `loginWithGoogle(code, state)` is called with valid parameters
- **AND** backend returns JWT tokens
- **THEN** auth store stores access token and refresh token
- **AND** auth store fetches and stores current user profile
- **AND** method resolves successfully

#### Scenario: loginWithGoogle handles backend errors
- **WHEN** `loginWithGoogle(code, state)` is called
- **AND** backend returns an error response
- **THEN** method throws an error with the error message
- **AND** auth store state remains unchanged

### Requirement: API client provides Google OAuth methods

The API client SHALL provide methods for Google OAuth operations.

#### Scenario: getGoogleAuthUrl returns authorization URL
- **WHEN** `getGoogleAuthUrl()` is called
- **AND** backend OAuth is configured
- **THEN** method returns object containing `authorization_url` string

#### Scenario: googleCallback exchanges code for tokens
- **WHEN** `googleCallback(code, state)` is called with valid parameters
- **THEN** method sends GET request to `/auth/google/callback` with code and state as query parameters
- **AND** returns Token object containing access_token, refresh_token, and token_type

### Requirement: Existing email/password login remains functional

The Google OAuth integration SHALL NOT affect existing email/password authentication.

#### Scenario: Email/password login still works
- **WHEN** user submits the email/password login form
- **THEN** system authenticates via existing flow
- **AND** user is logged in successfully

#### Scenario: Email/password registration still works
- **WHEN** user submits the registration form with email/password
- **THEN** system registers user via existing flow
- **AND** user account is created successfully
