from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserPreferences(BaseModel):
    break_interval_minutes: int = Field(default=20, ge=5, le=60, description="Reminder interval in minutes")
    break_duration_seconds: int = Field(default=20, ge=10, le=60, description="Break countdown duration in seconds")
    sound_enabled: bool = Field(default=True, description="Enable synthesized audio chime on break prompt")
    browser_notifications: bool = Field(default=True, description="Enable browser notifications")
    target_daily_screen_hours: float = Field(default=6.0, ge=1.0, le=16.0, description="Personal daily screen-work budget")

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password with minimum 6 characters")
    full_name: str = Field(min_length=2, max_length=100)
    preferences: Optional[UserPreferences] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    preferences: UserPreferences
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserUpdatePreferences(BaseModel):
    break_interval_minutes: Optional[int] = Field(default=None, ge=5, le=60)
    break_duration_seconds: Optional[int] = Field(default=None, ge=10, le=60)
    sound_enabled: Optional[bool] = None
    browser_notifications: Optional[bool] = None
    target_daily_screen_hours: Optional[float] = Field(default=None, ge=1.0, le=16.0)
