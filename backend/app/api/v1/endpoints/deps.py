from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.services.auth_service import auth_service
from app.models.user import UserResponse, UserPreferences

security_scheme = HTTPBearer(auto_error=True)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> UserResponse:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload["sub"]
    user_data = auth_service.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        full_name=user_data["full_name"],
        preferences=UserPreferences(**user_data.get("preferences", UserPreferences().model_dump())),
        created_at=user_data.get("created_at", "")
    )
