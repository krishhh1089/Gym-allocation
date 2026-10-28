import uuid
import pytest
from jose import JWTError, jwt

from app.config import settings
from app.services.auth_service import (
    build_google_redirect_url,
    create_access_token,
    decode_access_token,
    generate_session_token,
    validate_email_domain,
)


def test_build_google_redirect_url():
    url = build_google_redirect_url("test_state_123")
    assert "https://accounts.google.com/o/oauth2/v2/auth" in url
    assert "state=test_state_123" in url
    assert "scope=" in url


def test_validate_email_domain_valid():
    # Should not raise
    validate_email_domain("student@srmap.edu.in")
    validate_email_domain("admin@SRMAP.EDU.IN")


def test_validate_email_domain_invalid():
    with pytest.raises(ValueError, match="is not permitted"):
        validate_email_domain("user@gmail.com")

    with pytest.raises(ValueError, match="is not permitted"):
        validate_email_domain("hacker@otherdomain.com")


def test_jwt_create_and_decode():
    uid = uuid.uuid4()
    token, expires_at = create_access_token(
        user_id=uid,
        email="test@srmap.edu.in",
        roles=["STUDENT", "TRAINER"],
        status="ACTIVE",
    )
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_access_token(token)
    assert payload["sub"] == str(uid)
    assert payload["email"] == "test@srmap.edu.in"
    assert payload["roles"] == ["STUDENT", "TRAINER"]
    assert payload["status"] == "ACTIVE"


def test_jwt_tampered_fails():
    token, _ = create_access_token(
        user_id=uuid.uuid4(),
        email="test@srmap.edu.in",
        roles=["STUDENT"],
        status="ACTIVE",
    )
    tampered = token[:-4] + "abcd"
    with pytest.raises(JWTError):
        decode_access_token(tampered)


def test_generate_session_token():
    s1 = generate_session_token()
    s2 = generate_session_token()
    assert len(s1) >= 48
    assert s1 != s2
