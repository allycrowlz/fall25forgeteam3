from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from . import expenses, group_routes, main


# RUN: fastapi dev backend/app/api_connection.py for development server

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.include_router(group_routes.router)
app.include_router(expenses.router)
app.include_router(main.router)




