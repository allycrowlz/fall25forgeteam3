import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting up Homebase API...")
    try:
        # Test database connection
        from db.connection import get_connection
        conn = get_connection()
        conn.close()
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Homebase API...")

# Create FastAPI application
backend.app = FastAPI(
    title="Homebase API",
    description="API for managing shopping lists and user profiles",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
backend.app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Catch-all exception handler for unexpected errors"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "type": "internal_server_error"
        }
    )

# Import routers AFTER app is created to avoid circular imports
from app import auth_routes, shopping_list_routes, group_routes, expenses

# Include routers
backend.app.include_router(
    auth_routes.router,
    prefix="/api/auth",
    tags=["Authentication"]
)

backend.app.include_router(
    shopping_list_routes.router,
    tags=["Shopping Lists"]
)

# Root endpoint
@app.get("/", tags=["Health"])
async def root():
    """API health check endpoint"""
    return {
        "message": "Homebase API is running!",
        "status": "healthy",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint"""
    try:
        from db.connection import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": "1.0.0"
    }