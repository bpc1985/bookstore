import pytest
from datetime import timedelta
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.config import get_settings


class TestPasswordHashing:
    def test_get_password_hash_returns_different_hashes(self):
        hash1 = get_password_hash("password123")
        hash2 = get_password_hash("password123")
        assert hash1 != hash2

    def test_get_password_hash_is_bcrypt(self):
        password_hash = get_password_hash("password123")
        assert password_hash.startswith("$2b$")

    def test_verify_password_correct(self):
        password = "password123"
        password_hash = get_password_hash(password)
        assert verify_password(password, password_hash) is True

    def test_verify_password_incorrect(self):
        password_hash = get_password_hash("password123")
        assert verify_password("wrongpassword", password_hash) is False


class TestAccessToken:
    def test_create_access_token_default_expiration(self):
        token = create_access_token(subject=1)
        assert isinstance(token, str)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["type"] == "access"
        assert "exp" in payload

    def test_create_access_token_custom_expiration(self):
        custom_delta = timedelta(minutes=30)
        token = create_access_token(subject=1, expires_delta=custom_delta)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["type"] == "access"

    def test_create_access_token_different_subjects(self):
        token1 = create_access_token(subject=1)
        token2 = create_access_token(subject=2)
        assert token1 != token2
        payload1 = decode_token(token1)
        payload2 = decode_token(token2)
        assert payload1["sub"] != payload2["sub"]


class TestRefreshToken:
    def test_create_refresh_token_default_expiration(self):
        settings = get_settings()
        token = create_refresh_token(subject=1)
        assert isinstance(token, str)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["type"] == "refresh"
        assert "exp" in payload

    def test_create_refresh_token_custom_expiration(self):
        custom_delta = timedelta(days=14)
        token = create_refresh_token(subject=1, expires_delta=custom_delta)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["type"] == "refresh"


class TestDecodeToken:
    def test_decode_valid_token(self):
        token = create_access_token(subject=1)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["type"] == "access"

    def test_decode_invalid_token(self):
        payload = decode_token("invalid.token.string")
        assert payload is None

    def test_decode_empty_token(self):
        payload = decode_token("")
        assert payload is None

    def test_decode_token_with_wrong_secret(self):
        from jose import jwt
        settings = get_settings()
        wrong_secret = "wrong-secret-key"
        payload_data = {"sub": "1", "exp": 9999999999, "type": "access"}
        token = jwt.encode(payload_data, wrong_secret, algorithm=settings.algorithm)
        decoded = decode_token(token)
        assert decoded is None
