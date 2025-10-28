from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import user, prediction

app = FastAPI()

# Enable CORS for frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(prediction.router, prefix="/api/dish", tags=["prediction"])

@app.get("/")
def read_root():
    return {"NutriPK": "Backend is running"}