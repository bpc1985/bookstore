## Context

The frontend currently uses email/password authentication via a Zustand store (`src/stores/auth.ts`) and API client (`src/lib/api.ts`). The login and signup pages use TanStack React Form with Zod validation and shadcn/ui components.

The backend Google OAuth endpoints are ready:
- `GET /auth/google` - Returns Google authorization URL
- `GET /auth/google/callback?code=...&state=...` - Exchanges code for JWT tokens

This design adds the frontend UI to consume these endpoints.

**Constraints:**
- Frontend-only change (backend is complete)
- Must integrate with existing Zustand auth store
- Follow existing patterns (shadcn/ui, TanStack, Sonner toasts)
- Callback page must be a Client Component (uses router, state)

## Goals / Non-Goals

**Goals:**
- Add Google sign-in button to login page
- Add Google sign-up button to registration page
- Handle OAuth callback and store tokens
- Display errors via toast notifications
- Maintain existing email/password flow unchanged

**Non-Goals:**
- Google account linking from profile (defer to separate change)
- Custom Google button styling (use simple text button initially)
- Google One Tap sign-in (popup-based flow)
- Remember OAuth state across page refreshes

## Decisions

### 1. OAuth Flow: Full Page Redirect

**Decision:** Use full page redirect to Google, not popup.

**Alternatives considered:**
- Popup window: Better UX but blocked by browsers, complex to implement
- Google One Tap: Requires Google SDK, additional setup

**Rationale:** Full redirect is simpler, works everywhere, and matches the backend implementation which returns a redirect URL.

### 2. Callback Page Route: `/auth/google/callback`

**Decision:** Create dedicated callback page at `src/app/auth/google/callback/page.tsx`.

**Alternatives considered:**
- Handle in login page with query params: Mixes concerns, complex state
- API route: Not needed, callback logic is client-side

**Rationale:** Clean separation. Callback page extracts code/state from URL, calls backend, stores tokens, redirects to home.

### 3. Button Component: Reusable `GoogleSignInButton`

**Decision:** Create `src/components/auth/GoogleSignInButton.tsx` as a reusable Client Component.

```tsx
<GoogleSignInButton variant="signin" />  // "Sign in with Google"
<GoogleSignInButton variant="signup" />  // "Sign up with Google"
```

**Rationale:** Avoid duplication between login and signup pages. Single component handles fetching auth URL and redirecting.

### 4. State Management: Extend Existing Auth Store

**Decision:** Add `loginWithGoogle(code, state)` method to auth store.

**Flow:**
1. Button fetches auth URL from `GET /auth/google`
2. Browser redirects to Google
3. Google redirects to `/auth/google/callback?code=...&state=...`
4. Callback page calls `authStore.loginWithGoogle(code, state)`
5. Store calls backend callback endpoint, receives tokens
6. Store fetches user profile, updates state
7. Redirect to home

**Rationale:** Follows existing pattern where store methods handle API calls and state updates.

### 5. API Client Methods

**Decision:** Add two methods to `ApiClient`:

```typescript
async getGoogleAuthUrl(): Promise<{ authorization_url: string }>
async googleCallback(code: string, state: string): Promise<Token>
```

**Rationale:** Matches existing API client pattern. Callback method mirrors existing `login()` return type.

### 6. Error Handling

**Decision:** Use Sonner toast for all OAuth errors.

| Error | Message |
|-------|---------|
| 503 (not configured) | "Google sign-in is not available" |
| 400 (invalid state) | "Sign-in failed. Please try again." |
| 401 (invalid code) | "Sign-in failed. Please try again." |
| Network error | "Unable to connect. Please try again." |

**Rationale:** Consistent with existing auth error handling. User-friendly messages without exposing technical details.

### 7. Loading States

**Decision:** Show loading spinner on button during auth URL fetch, show full-page loader on callback page.

**Rationale:** Button loading prevents double-clicks. Callback page loader indicates background processing.

## Risks / Trade-offs

**[Risk] OAuth state lost on page refresh** → User must restart OAuth flow. Mitigation: Flow is quick, acceptable UX.

**[Risk] Backend returns 503 if OAuth not configured** → Button click shows error. Mitigation: Display toast with clear message; consider hiding button if not configured (future enhancement).

**[Risk] Callback page visible briefly** → User sees loading state. Mitigation: Keep loading UI clean; redirect happens quickly.

**[Trade-off] No Google branding** → We use a simple text button, not official Google button. Accepted: Faster to implement; can enhance later with proper branding if needed.

## Open Questions

1. **Should we hide the Google button if OAuth is not configured?** Could check on page load, but adds complexity. Defer for now.
2. **Should callback page preserve original redirect URL?** (e.g., user tried to access /checkout, was redirected to login). Defer for now - always redirect to home.
