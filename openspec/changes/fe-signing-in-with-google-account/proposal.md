## Why

The backend Google OAuth API is ready (see `openspec/specs/google-oauth/`), but users cannot use it because there's no frontend UI. Adding a "Sign in with Google" button provides users a faster, more convenient authentication option that reduces form friction.

## What Changes

This is a **frontend-only** change (`fe-` prefix) affecting `apps/frontend/`.

- Add "Sign in with Google" button to login page (`/login`)
- Add "Sign up with Google" button to registration page (`/signup`)
- Create callback page to handle OAuth redirect and token exchange
- Extend auth Zustand store with Google OAuth login method
- Add API client methods for Google OAuth endpoints
- Handle OAuth errors with user-friendly messages
- Optionally show "Link Google Account" in user profile/settings

## Capabilities

### New Capabilities

- `google-oauth-ui`: Frontend UI for Google OAuth sign-in including button components, callback handling, and auth store integration

### Modified Capabilities

None - no existing frontend specs to modify.

## Impact

**Code changes:**
- `src/app/login/page.tsx` - Add Google sign-in button
- `src/app/signup/page.tsx` - Add Google sign-up button
- `src/app/auth/google/callback/page.tsx` - New callback page for OAuth redirect
- `src/stores/auth.ts` - Add `loginWithGoogle()` method
- `src/lib/api.ts` - Add `getGoogleAuthUrl()` and `googleCallback()` methods
- `src/components/auth/GoogleSignInButton.tsx` - New reusable component

**Dependencies:**
- Consumes backend endpoints: `GET /auth/google`, `GET /auth/google/callback`

**User Experience:**
- Google button appears alongside existing email/password form
- Single click initiates OAuth flow (redirects to Google)
- Callback page handles token exchange and redirects to home
- Errors display via toast notifications
