import uuid
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.dependencies.db import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer JWT token and return the authenticated user."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedException("Authentication required")

    payload = decode_access_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise UnauthorizedException("Invalid or expired token")

    try:
        user_id = uuid.UUID(payload["sub"])
    except ValueError:
        raise UnauthorizedException("Invalid token subject")

    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise UnauthorizedException("User not found")

    return user
