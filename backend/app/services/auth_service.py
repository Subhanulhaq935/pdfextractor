from sqlalchemy.orm import Session
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import TokenResponse, UserLogin, UserRegister


class AuthService:
    def __init__(self, db: Session) -> None:
        self.user_repo = UserRepository(db)

    def register(self, data: UserRegister) -> User:
        existing = self.user_repo.get_by_email(data.email)
        if existing is not None:
            raise ConflictException("An account with this email already exists")
        return self.user_repo.create(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
        )

    def login(self, data: UserLogin) -> TokenResponse:
        user = self.user_repo.get_by_email(data.email)
        if user is None or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        token = create_access_token(subject=str(user.id))
        return TokenResponse(access_token=token)
