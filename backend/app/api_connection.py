from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app import auth_routes, expenses, group_routes, shopping_list_routes, chores_routes, events


app = FastAPI(title="HomeBase API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with proper prefixes
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
app.include_router(group_routes.router, prefix="/api", tags=["Groups"])
app.include_router(shopping_list_routes.router, tags=["shopping-lists"])
app.include_router(chores_routes.router, prefix="/api", tags=["Chores"]) 
app.include_router(events.router, prefix="/api", tags=["Events"])

@app.get("/")
def root():
    return {
        "message": "HomeBase API",
        "version": "1.0",
        "documentation": "/docs"
    }



