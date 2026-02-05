import pytest
from unittest.mock import Mock, patch
from app.services.oauth import OAuthService


@pytest.mark.asyncio
class TestOAuthService:
    async def test_is_oauth_configured_true(self):
        with patch("app.services.oauth.get_settings") as mock_settings:
            mock_settings.return_value.google_client_id = "test_client_id"
            mock_settings.return_value.google_client_secret = "test_secret"
            
            oauth_service = OAuthService()
            assert oauth_service.is_oauth_configured() is True

    async def test_is_oauth_configured_false(self):
        with patch("app.services.oauth.get_settings") as mock_settings:
            mock_settings.return_value.google_client_id = ""
            mock_settings.return_value.google_client_secret = ""
            
            oauth_service = OAuthService()
            assert oauth_service.is_oauth_configured() is False

    async def test_get_authorization_url(self):
        with patch("app.services.oauth.get_settings") as mock_settings:
            mock_settings.return_value.google_client_id = "test_client_id"
            mock_settings.return_value.google_client_secret = "test_secret"
            mock_settings.return_value.google_redirect_uri = "http://localhost:3000/auth/google/callback"
            
            oauth_service = OAuthService()
            auth_url, state = oauth_service.get_authorization_url()
            
            assert "accounts.google.com" in auth_url
            assert "test_client_id" in auth_url
            assert state is not None
            assert len(state) > 0

    async def test_get_authorization_url_not_configured(self):
        with patch("app.services.oauth.get_settings") as mock_settings:
            mock_settings.return_value.google_client_id = ""
            
            oauth_service = OAuthService()
            
            with pytest.raises(ValueError, match="Google OAuth is not configured"):
                oauth_service.get_authorization_url()

    async def test_validate_state(self):
        with patch("app.services.oauth.get_settings"):
            oauth_service = OAuthService()
            OAuthService._state_store["test_state"] = "test_verifier"

            verifier = oauth_service.validate_state("test_state")
            assert verifier == "test_verifier"
            assert "test_state" not in OAuthService._state_store

    async def test_validate_state_invalid(self):
        with patch("app.services.oauth.get_settings"):
            oauth_service = OAuthService()
            
            verifier = oauth_service.validate_state("invalid_state")
            assert verifier is None
