from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

import expenses, group_routes, main


# RUN: fastapi dev backend/app/api_connection.py for development server

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"
                   , "http://localhost:5173"
                   , "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(group_routes.router)
app.include_router(expenses.router)
app.include_router(main.router)

