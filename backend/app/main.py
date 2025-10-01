import logfire
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

logfire.configure()  
logfire.info('Hello, {name}!', name='world')


