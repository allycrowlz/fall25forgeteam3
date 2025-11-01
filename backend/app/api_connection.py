from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

import expenses, group_routes


# RUN: fastapi dev backend/app/api_connection.py for development server

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(group_routes.router)
app.include_router(expenses.router)




