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
    age: Optional[int] = None
    bmi: Optional[float] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    profile_image_url: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr]
    age: Optional[int]
    bmi: Optional[float]
    height: Optional[int]
    weight: Optional[int]
    profile_image_url: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str