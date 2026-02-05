## 1. API Client

- [x] 1.1 Add `getGoogleAuthUrl()` method to `src/lib/api.ts` returning `{ authorization_url: string }`
- [x] 1.2 Add `googleCallback(code: string, state: string)` method to `src/lib/api.ts` returning `Token`

## 2. Auth Store

- [x] 2.1 Add `loginWithGoogle(api, code, state)` method to `src/stores/auth.ts`
- [x] 2.2 Implement token storage and user profile fetch in `loginWithGoogle`

## 3. Google Sign-In Button Component

- [x] 3.1 Create `src/components/auth/GoogleSignInButton.tsx` as Client Component
- [x] 3.2 Add `variant` prop for "signin" and "signup" text variations
- [x] 3.3 Implement loading state with spinner during auth URL fetch
- [x] 3.4 Implement redirect to Google authorization URL on success
- [x] 3.5 Add error handling with Sonner toast for 503 and network errors

## 4. Login Page Integration

- [x] 4.1 Import and add `GoogleSignInButton` to `src/app/login/page.tsx`
- [x] 4.2 Add visual separator between form and Google button (e.g., "or" divider)

## 5. Signup Page Integration

- [x] 5.1 Import and add `GoogleSignInButton` to `src/app/signup/page.tsx`
- [x] 5.2 Add visual separator between form and Google button

## 6. OAuth Callback Page

- [x] 6.1 Create `src/app/auth/google/callback/page.tsx` as Client Component
- [x] 6.2 Extract `code` and `state` from URL search params
- [x] 6.3 Redirect to `/login` if parameters are missing
- [x] 6.4 Call `authStore.loginWithGoogle()` with extracted parameters
- [x] 6.5 Display loading indicator during token exchange
- [x] 6.6 Redirect to home page on success
- [x] 6.7 Display toast and redirect to `/login` on error (400, 401)

## 7. Unit Tests

- [x] 7.1 Test `getGoogleAuthUrl()` API method returns authorization URL
- [x] 7.2 Test `googleCallback()` API method returns Token
- [x] 7.3 Test `loginWithGoogle()` stores tokens and fetches user
- [x] 7.4 Test `loginWithGoogle()` throws on backend error
- [x] 7.5 Test `GoogleSignInButton` renders with correct variant text
- [x] 7.6 Test `GoogleSignInButton` shows loading state on click
- [x] 7.7 Test `GoogleSignInButton` displays error toast on 503
- [x] 7.8 Test callback page redirects to login when params missing
- [x] 7.9 Test callback page redirects to home on success

## 8. Integration Testing

- [x] 8.1 Verify existing email/password login still works
- [x] 8.2 Verify existing email/password registration still works
- [x] 8.3 Test full OAuth flow with mocked backend responses
