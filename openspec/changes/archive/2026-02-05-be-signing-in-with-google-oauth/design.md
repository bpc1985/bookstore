## Context

The bookstore backend currently uses email/password authentication with JWT tokens. Users must register with an email and password to create an account. The existing auth system in `app/services/auth.py` handles login, registration, token refresh, and logout with token blacklisting.

This design adds Google OAuth 2.0 as an alternative authentication method while preserving the existing email/password flow.

**Current auth flow:**
1. User registers with email/password → User created with `hashed_password`
2. User logs in → JWT access + refresh tokens issued
3. Tokens validated via `get_current_user` dependency

**Constraints:**
- Backend-only change (frontend will consume new endpoints separately)
- Must integrate with existing JWT token system
- SQLite database with Alembic migrations
- Existing User model has required `hashed_password` field

## Goals / Non-Goals

**Goals:**
- Allow users to sign in with Google OAuth 2.0
- Automatically create accounts for new Google users
- Allow existing users to link Google accounts via email matching
- Issue standard JWT tokens after OAuth authentication
- Support OAuth-only users (no password required)

**Non-Goals:**
- Frontend implementation (separate `fe-` change)
- Other OAuth providers (Apple, GitHub, etc.) - future work
- Account merging UI for conflicting accounts
- Google-specific scopes beyond basic profile/email

## Decisions

### 1. OAuth Library: `authlib`

**Decision:** Use `authlib` for OAuth 2.0 implementation.

**Alternatives considered:**
- `google-auth`: Google-specific, requires more manual flow handling
- `python-social-auth`: Heavy, designed for Django, overkill for our needs
- Manual implementation: Error-prone, security risks

**Rationale:** `authlib` is lightweight, well-maintained, and provides async support compatible with FastAPI. It handles token exchange, verification, and CSRF protection.

### 2. OAuth Flow: Authorization Code with PKCE

**Decision:** Use Authorization Code flow with PKCE (Proof Key for Code Exchange).

**Flow:**
```
1. GET /auth/google → Returns Google authorization URL with state + code_verifier
2. User authorizes on Google
3. GET /auth/google/callback?code=...&state=... → Exchange code for tokens
4. Backend verifies Google ID token, creates/links user, returns JWT tokens
```

**Rationale:** PKCE adds security for public clients (mobile/SPA). State parameter prevents CSRF attacks.

### 3. User Model Extension

**Decision:** Add nullable `google_id` column to User model.

```python
google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True, index=True)
```

**Alternatives considered:**
- Separate OAuth identities table: More flexible but adds complexity for single provider
- Store in JSON field: Harder to query and index

**Rationale:** Simple, queryable, supports future uniqueness constraints. Can migrate to separate table later if multiple providers needed.

### 4. Password Handling for OAuth Users

**Decision:** Make `hashed_password` nullable for OAuth-only users.

**Alternatives considered:**
- Generate random password: Security anti-pattern, user can't use it
- Require password after OAuth: Friction, defeats purpose of OAuth

**Rationale:** OAuth-only users authenticate via Google, not password. Nullable password is clean and honest about the auth method.

### 5. Account Linking Strategy

**Decision:** Auto-link by email match, with explicit linking endpoint for logged-in users.

**Scenarios:**
| Scenario | Behavior |
|----------|----------|
| New Google user, email not in DB | Create new account |
| New Google user, email exists (password user) | Link Google to existing account |
| Existing Google-linked user | Sign in, return tokens |
| Logged-in user wants to link Google | Explicit `/auth/google/link` endpoint |

**Rationale:** Email-based auto-linking provides seamless UX. Explicit linking endpoint gives control to authenticated users.

### 6. Configuration

**Decision:** Add Google OAuth settings to existing `Settings` class.

```python
google_client_id: str = ""
google_client_secret: str = ""
google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
```

**Rationale:** Follows existing pattern, uses environment variables via pydantic-settings.

## Risks / Trade-offs

**[Risk] Email trust from Google** → We trust Google's email verification. Google accounts with unverified emails could theoretically claim ownership of an email. Mitigation: Google requires email verification for most accounts; accept this trust model.

**[Risk] Account takeover via email matching** → If attacker controls Google account with victim's email, they gain access. Mitigation: This is inherent to email-based linking; document that users should secure their Google accounts.

**[Risk] Migration changes existing column** → Making `hashed_password` nullable affects existing code. Mitigation: Audit all password checks; login flow already validates password presence.

**[Trade-off] Single provider focus** → Design is Google-specific, not provider-agnostic. Accepted: YAGNI - we can refactor to multi-provider if needed.

## Migration Plan

1. **Database migration:** Add `google_id` column (nullable), make `hashed_password` nullable
2. **Deploy new endpoints:** Endpoints are additive, no breaking changes
3. **Configure credentials:** Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables
4. **Rollback:** Remove endpoints, revert migration (no data loss since column is nullable)

## Open Questions

1. **Should we store Google profile picture URL?** Could enhance user profiles but adds sync complexity. Defer for now.
2. **Rate limiting on OAuth endpoints?** Should match existing auth rate limits. Implement if auth rate limiting exists.
