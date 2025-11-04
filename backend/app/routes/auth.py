from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# MongoDB setup
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.nutripk
users_collection = db.users

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT setup
SECRET_KEY = os.getenv('JWT_SECRET', 'nutripksecret')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    status: str
    message: str
    token: str = None




async def get_user_by_email(email: str):
    return await users_collection.find_one({"email": email})

@router.post('/signup', response_model=TokenResponse)
async def signup(user: UserSignup):
    if await get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered.")
    hashed_pw = pwd_context.hash(user.password)
    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
        "auth_provider": "local",
        "created_at": datetime.utcnow(),
        "phone": user.phone
    }
    await users_collection.insert_one(user_doc)
    token = jwt.encode({"sub": user.email, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}, SECRET_KEY, algorithm=ALGORITHM)
    return TokenResponse(status="success", message="User registered.", token=token)

@router.post('/login', response_model=TokenResponse)
async def login(user: UserLogin):
    db_user = await get_user_by_email(user.email)
    if not db_user or not pwd_context.verify(user.password, db_user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    token = jwt.encode({"sub": user.email, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}, SECRET_KEY, algorithm=ALGORITHM)
    return TokenResponse(status="success", message="Login successful.", token=token)