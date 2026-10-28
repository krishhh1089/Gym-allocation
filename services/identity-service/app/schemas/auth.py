"""
Pydantic schemas specific to the authentication flow.
"""

from pydantic import BaseModel


class OAuthStatePayload(BaseModel):
    """Signed state payload stored in cookie during OAuth redirect."""
    redirect_uri: str = "/"


class TokenIntrospection(BaseModel):
    """Internal token validation result passed between layers."""
    user_id: str
    email: str
    roles: list[str]
    status: str
