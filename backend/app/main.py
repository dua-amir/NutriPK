from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import user

app = FastAPI()

# Enable CORS for frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/api/user", tags=["user"])

@app.post("/api/predict-dish")
async def predict_dish(file: bytes = None):
    # Dummy model logic: always returns "biryani" for demo
    # Replace with your real ML model code
    dish = "biryani"
    return {"dish": dish}

@app.get("/")
def read_root():
    return {"NutriPK": "Backend is running"}