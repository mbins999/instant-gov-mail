from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from database import init_database
from routes import auth, users, correspondences, entities

# Initialize FastAPI app
app = FastAPI(
    title="MOI Correspondence Management API",
    description="Backend API for MOI Correspondence Management System",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(correspondences.router, prefix="/api")
app.include_router(entities.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        init_database()
        print("✓ ClickHouse database initialized successfully")
    except Exception as e:
        print(f"✗ Failed to initialize database: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "MOI Correspondence API",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "MOI Correspondence Management API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
