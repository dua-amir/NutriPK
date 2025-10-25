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

# Google token verification
try:
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
except Exception:
    google_id_token = None
    google_requests = None

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


class GoogleToken(BaseModel):
    id_token: str

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

# Google OAuth route placeholder
@router.post('/google', response_model=TokenResponse)
async def google_login():
    raise HTTPException(status_code=501, detail="Google login not configured on server.")


@router.post('/google', response_model=TokenResponse)
async def google_login(token: GoogleToken):
    # Expect client to send the Google ID token obtained from client-side OAuth
    if not google_id_token or not google_requests:
        raise HTTPException(status_code=500, detail="Google auth libraries not installed on server.")

    try:
        CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
        # verify_oauth2_token will raise if invalid
        idinfo = google_id_token.verify_oauth2_token(token.id_token, google_requests.Request(), CLIENT_ID)
        # idinfo contains email, name, sub, email_verified
        email = idinfo.get('email')
        name = idinfo.get('name') or idinfo.get('email')
        if not email:
            raise HTTPException(status_code=400, detail='Email not available in Google token.')

        existing = await get_user_by_email(email)
        if existing:
            # If existing user used local auth, we might still allow google login
            # Return JWT
            token_out = jwt.encode({"sub": email, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}, SECRET_KEY, algorithm=ALGORITHM)
            return TokenResponse(status='success', message='Login via Google successful.', token=token_out)

        # Create new user with provider google
        user_doc = {
            'name': name,
            'email': email,
            'password': '',
            'auth_provider': 'google',
            'created_at': datetime.utcnow()
        }
        await users_collection.insert_one(user_doc)
        token_out = jwt.encode({"sub": email, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}, SECRET_KEY, algorithm=ALGORITHM)
        return TokenResponse(status='success', message='User created via Google.', token=token_out)
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid Google token.')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
