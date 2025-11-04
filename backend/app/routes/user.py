from fastapi import APIRouter, HTTPException, status, Depends, Body, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserLogin, UserProfile, UserUpdate, PasswordResetRequest, OTPVerify
from app.utils.email_utils import send_reset_email
from app.utils.email_utils import send_otp_email
from fastapi import UploadFile, File, Form
import os

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

async def get_user_by_email(email: str):
    user = await user_collection.find_one({"email": email})
    return user

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    # Debug: log incoming Authorization header and token presence
    try:
        auth_hdr = request.headers.get('authorization')
        print(f"get_current_user: Authorization header: {auth_hdr}")
    except Exception:
        auth_hdr = None
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        # Log the error to help debugging
        import traceback
        print('JWT decode failed:', traceback.format_exc())
        raise credentials_exception
    user = await get_user_by_email(email)
    if user is None:
        raise credentials_exception
    return user


@router.post("/signup", response_model=UserProfile)
async def signup(user: UserCreate):
    existing = await get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "email": user.email,
        "username": user.username,
        "password": hashed_password,
        "bmi": None,
        "height": None,
        "weight": None,
        "age": None,
        "profile_image_url": None,
    }
    await user_collection.insert_one(user_dict)
    user_dict.pop("password")
    return UserProfile(**user_dict)


# Token endpoint for OAuth2
@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user_by_email(form_data.username)
    if not user:
        raise HTTPException(status_code=404, detail="Account does not exist. Please sign up first.")
    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password.")
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=UserProfile)
async def login(data: UserLogin):
    user = await get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Account does not exist. Please sign up first.")
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password.")
    user.pop("password")
    # Ensure profile_image_url is present
    user.setdefault("profile_image_url", None)
    access_token = create_access_token(data={"sub": user["email"]})
    profile = UserProfile(**user)
    return {**profile.dict(), "access_token": access_token, "token_type": "bearer"}


@router.get("/profile/{email}", response_model=UserProfile)
async def get_profile(email: str, current_user: dict = Depends(get_current_user)):
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pop("password")
    # Ensure all required fields are present
    user.setdefault("profile_image_url", None)
    user.setdefault("age", None)
    user.setdefault("height", None)
    user.setdefault("weight", None)
    return UserProfile(**user)


@router.put("/profile/{email}", response_model=UserProfile)
async def update_profile(
    request: Request,
    email: str,
    age: int = Form(...),
    height: int = Form(...),
    weight: int = Form(...),
    profile_image_url: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = {
        "age": age,
        "height": height,
        "weight": weight,
    }
    image_url = user.get("profile_image_url")
    # Read raw form to tolerate different client behaviors
    form = await request.form()

    # Debug: print form keys and type info
    try:
        print('Received form keys:', list(form.keys()))
        sample = form.get('profile_image_file')
        if sample is None:
            print('No profile_image_file field received')
        else:
            print('profile_image_file type:', type(sample), 'has_filename:', hasattr(sample, 'filename'))
    except Exception:
        pass

    profile_image_file = form.get('profile_image_file')
    # Also support profile_image_data (data URI base64) from native clients
    profile_image_data = form.get('profile_image_data')
    # If field is an UploadFile-like object (Starlette UploadFile), it will be instance of UploadFile or have filename/read
    try:
        from fastapi import UploadFile as _UploadFile
    except Exception:
        _UploadFile = None

    is_upload = False
    if profile_image_file is not None:
        is_upload = (hasattr(profile_image_file, 'filename') and hasattr(profile_image_file, 'read')) or (_UploadFile is not None and isinstance(profile_image_file, _UploadFile))

    if is_upload:
        try:
            filename = getattr(profile_image_file, 'filename', f'{email}.jpg')
            ext = os.path.splitext(filename)[1] or '.jpg'
            img_name = f"{email}{ext}"
            # Build absolute path inside the app/models/profile_images directory so it's unambiguous
            base_app_dir = os.path.dirname(os.path.dirname(__file__))  # backend/app
            img_dir = os.path.join(base_app_dir, 'models', 'profile_images')
            os.makedirs(img_dir, exist_ok=True)
            img_path = os.path.join(img_dir, img_name)
            contents = await profile_image_file.read()
            with open(img_path, 'wb') as f:
                f.write(contents)
            image_url = f"/static/profile_images/{img_name}"
            print(f"Saved profile image for {email} -> {img_path} (size={len(contents)} bytes)")
            update_data['profile_image_url'] = image_url
        except Exception as e:
            print(f"Failed to save profile image for {email}: {e}")
            # don't raise; continue and allow other updates
            pass
    else:
        # If profile_image_file exists but wasn't an UploadFile, log its repr for debugging
        if profile_image_file is not None and not is_upload:
            try:
                print(f"profile_image_file (raw): {repr(profile_image_file)[:400]}")
            except Exception:
                pass
        # If profile_image_data (base64 Data URI) was provided, decode and save it
        if profile_image_data:
            try:
                # data:[mime];base64,[data]
                header, b64data = profile_image_data.split(',', 1)
                # infer extension
                if 'image/png' in header:
                    ext = '.png'
                else:
                    ext = '.jpg'
                img_name = f"{email}{ext}"
                base_app_dir = os.path.dirname(os.path.dirname(__file__))
                img_dir = os.path.join(base_app_dir, 'models', 'profile_images')
                os.makedirs(img_dir, exist_ok=True)
                img_path = os.path.join(img_dir, img_name)
                import base64
                contents = base64.b64decode(b64data)
                with open(img_path, 'wb') as f:
                    f.write(contents)
                image_url = f"/static/profile_images/{img_name}"
                print(f"Saved profile image (base64) for {email} -> {img_path} (size={len(contents)} bytes)")
                update_data['profile_image_url'] = image_url
            except Exception as e:
                print(f"Failed to save profile image data for {email}: {e}")
                # fallback to profile_image_url if provided
                if profile_image_url:
                    update_data['profile_image_url'] = profile_image_url
        else:
            # If a URL string was provided via form (or client didn't send UploadFile), use provided profile_image_url field
            if profile_image_url:
                update_data["profile_image_url"] = profile_image_url
    await user_collection.update_one({"email": email}, {"$set": update_data})
    # Re-fetch user to get updated data
    updated_user = await get_user_by_email(email)
    updated_user.pop("password")
    return UserProfile(**updated_user)



@router.post("/forgot-password")
async def forgot_password(req: PasswordResetRequest):
    user = await get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    # Generate password reset token (JWT, expires in 30 min)
    token = create_access_token({"sub": user["email"]}, expires_delta=timedelta(minutes=30))
    reset_link = f"http://localhost:3000/reset-password?token={token}"  # Change to your frontend URL
    sent = send_reset_email(req.email, reset_link)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Please try again later.")
    return {"msg": "Password reset link sent to your email."}


@router.post("/send-otp")
async def send_otp(req: PasswordResetRequest):
    user = await get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    # generate secure 6-digit OTP
    import secrets
    otp = f"{secrets.randbelow(1000000):06d}"
    expires = datetime.utcnow() + timedelta(minutes=10)
    # store OTP and expiry in user document
    await user_collection.update_one({"email": req.email}, {"$set": {"otp_code": otp, "otp_expires": expires}})
    sent = send_otp_email(req.email, otp)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP. Please try again later.")
    return {"msg": "OTP sent to your email."}


@router.post("/verify-otp")
async def verify_otp(otp_req: OTPVerify):
    user = await get_user_by_email(otp_req.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    stored = user.get('otp_code')
    expires = user.get('otp_expires')
    if not stored or not expires:
        raise HTTPException(status_code=400, detail="No OTP requested for this account.")
    # compare and check expiry
    if str(stored) != str(otp_req.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP.")
    if isinstance(expires, str):
        try:
            from dateutil.parser import parse as parse_dt
            expires_dt = parse_dt(expires)
        except Exception:
            expires_dt = None
    else:
        expires_dt = expires
    if not expires_dt or datetime.utcnow() > expires_dt:
        raise HTTPException(status_code=400, detail="OTP expired.")
    # OTP valid -> remove otp fields and issue short lived token for reset (15 min)
    await user_collection.update_one({"email": otp_req.email}, {"$unset": {"otp_code": "", "otp_expires": ""}})
    token = create_access_token({"sub": otp_req.email}, expires_delta=timedelta(minutes=15))
    return {"msg": "OTP verified.", "token": token}

# Password reset endpoint
from app.models.user import PasswordReset

@router.post("/reset-password")
async def reset_password(data: PasswordReset):
    # Validate token and get email
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    hashed_password = get_password_hash(data.new_password)
    await user_collection.update_one({"email": email}, {"$set": {"password": hashed_password}})
    return {"msg": "Password has been reset successfully."}