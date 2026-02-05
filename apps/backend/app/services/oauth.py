import secrets
import httpx
from typing import Optional
from app.config import get_settings


class OAuthService:
    # Class-level state store to persist across requests
    _state_store: dict[str, str] = {}

    def __init__(self):
        self.settings = get_settings()
        self.google_client_id = self.settings.google_client_id
        self.google_client_secret = self.settings.google_client_secret
        google_redirect_uri = self.settings.google_redirect_uri
        # Remove trailing slash if present to avoid redirect_uri_mismatch
        self.google_redirect_uri = google_redirect_uri.rstrip('/')

    def is_oauth_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    def get_authorization_url(self) -> tuple[str, str]:
        if not self.is_oauth_configured():
            raise ValueError("Google OAuth is not configured")

        state = secrets.token_urlsafe(32)
        code_verifier = secrets.token_urlsafe(32)
        
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": self.google_client_id,
            "redirect_uri": self.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "code_challenge": code_verifier,
            "code_challenge_method": "plain",
        }
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        auth_url = f"{base_url}?{query_string}"
        
        OAuthService._state_store[state] = code_verifier
        return auth_url, state

    async def exchange_code_for_tokens(self, code: str, code_verifier: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": self.google_client_id,
                    "client_secret": self.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.google_redirect_uri,
                    "code_verifier": code_verifier,
                },
            )
            response.raise_for_status()
            return response.json()

    async def verify_google_token(self, id_token: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
            )
            response.raise_for_status()
            return response.json()

    def validate_state(self, state: str) -> Optional[str]:
        return OAuthService._state_store.pop(state, None)

    async def get_google_user_info(self, code: str, state: str) -> dict:
        code_verifier = self.validate_state(state)
        if not code_verifier:
            raise ValueError("Invalid state parameter")

        tokens = await self.exchange_code_for_tokens(code, code_verifier)
        id_token = tokens.get("id_token")
        
        if not id_token:
            raise ValueError("No ID token in response")

        user_info = await self.verify_google_token(id_token)
        return user_info
