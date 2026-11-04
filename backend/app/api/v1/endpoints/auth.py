from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    UserPreferences,
    UserUpdatePreferences
)
from app.services.auth_service import auth_service
from app.api.v1.endpoints.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["User Authentication"])

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
async def register(user_in: UserCreate):
    """
    Register a new user account with secure bcrypt password hashing and return a JWT access token.
    """
    try:
        return auth_service.register_user(user_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and obtain JWT token"
)
async def login(login_in: UserLogin):
    """
    Verify user credentials and return a signed JWT access token.
    """
    try:
        return auth_service.login_user(login_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile"
)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Retrieve profile details and personal ergonomic preferences for the authenticated user.
    """
    return current_user

@router.put(
    "/preferences",
    response_model=UserPreferences,
    summary="Update user ergonomic and notification preferences"
)
async def update_preferences(
    preferences_in: UserUpdatePreferences,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update personal reminder settings, sound toggles, and target daily screen work budgets.
    """
    try:
        return auth_service.update_preferences(current_user.id, preferences_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
