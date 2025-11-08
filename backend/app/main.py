from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import user, prediction, all_meals, weekly_summary, save_meal, delete_meal
import os

app = FastAPI()

# Enable CORS for frontend-backend communication (allow common dev origins)
def parse_origins(env_var: str):
    raw = os.getenv(env_var, "")
    if not raw:
        return []
    return [o.strip() for o in raw.split(",") if o.strip()]

# Allow origins are read from the ALLOWED_ORIGINS env var (comma-separated).
# This lets each developer set their own machine IPs without changing code.
allowed = parse_origins("ALLOWED_ORIGINS")
if not allowed:
    # fallback dev origins
    allowed = [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:19000",
        "http://127.0.0.1:19000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder so uploaded images can be served at /static/
static_path = os.path.join(os.path.dirname(__file__), "models")
app.mount("/static", StaticFiles(directory=static_path), name="static")
print(f"[startup] Static files mounted at: {os.path.abspath(static_path)}")

# Include routers
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(prediction.router, prefix="/api/dish", tags=["prediction"])
app.include_router(all_meals.router, prefix="/api/user", tags=["meal"])
app.include_router(weekly_summary.router, prefix="/api/user", tags=["summary"])
app.include_router(save_meal.router, prefix="/api/user", tags=["meal"])
app.include_router(delete_meal.router, prefix="/api/user", tags=["meal"])


@app.get("/")
def read_root():
    return {"NutriPK": "Backend is running"}