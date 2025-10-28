from fastapi import APIRouter, HTTPException, status, Depends, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserLogin, UserProfile, UserUpdate, PasswordResetRequest

from typing import Dict
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Request
import motor.motor_asyncio

router = APIRouter()

# MongoDB setup
MONGO_DETAILS = "mongodb://localhost:27017"
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
db = client.nutripk
user_collection = db.get_collection("users")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "nutripk_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    try:
        # bcrypt handles up to 72 bytes; long passwords are automatically hashed safely
        return pwd_context.hash(password.encode('utf-8', errors='ignore'))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Password hashing failed: {str(e)}")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_user_by_username(username: str):
    user = await user_collection.find_one({"username": username})
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await get_user_by_username(username)
    if user is None:
        raise credentials_exception
    return user


@router.post("/signup", response_model=UserProfile)
async def signup(user: UserCreate):
    existing = await user_collection.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "daily_water_intake": 2000,
        "bmi": 22.5,
        "height": 165,
        "weight": 60,
    }
    await user_collection.insert_one(user_dict)
    user_dict.pop("password")
    return UserProfile(**user_dict)


# Token endpoint for OAuth2
@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user_by_username(form_data.username)
    if not user:
        raise HTTPException(status_code=404, detail="Account does not exist. Please sign up first.")
    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password.")
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=UserProfile)
@router.post("/login")
async def login(data: UserLogin):
    user = await get_user_by_username(data.username)
    if not user:
        raise HTTPException(status_code=404, detail="Account does not exist. Please sign up first.")
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password.")
    user.pop("password")
    access_token = create_access_token(data={"sub": user["username"]})
    profile = UserProfile(**user)
    # Return both user info and token
    return {**profile.dict(), "access_token": access_token, "token_type": "bearer"}


@router.get("/profile/{username}", response_model=UserProfile)
async def get_profile(username: str, current_user: dict = Depends(get_current_user)):
    user = await get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pop("password")
    return UserProfile(**user)


@router.put("/profile/{username}", response_model=UserProfile)
async def update_profile(username: str, update: UserUpdate, current_user: dict = Depends(get_current_user)):
    user = await get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = {k: v for k, v in update.dict(exclude_unset=True).items()}
    await user_collection.update_one({"username": username}, {"$set": update_data})
    user.update(update_data)
    user.pop("password")
    return UserProfile(**user)


@router.post("/forgot-password")
async def forgot_password(req: PasswordResetRequest):
    user = await user_collection.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    # In real app, send email with reset link
    return {"msg": "Password reset link sent (mock)"}