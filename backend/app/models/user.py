from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: Optional[str] = None
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(UserBase):
    daily_water_intake: Optional[int] = 2000
    bmi: Optional[float] = 22.5
    height: Optional[int] = 165
    weight: Optional[int] = 60
    profile_image_url: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr]
    daily_water_intake: Optional[int]
    bmi: Optional[float]
    height: Optional[int]
    weight: Optional[int]
    profile_image_url: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str