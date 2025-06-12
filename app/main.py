from fastapi import FastAPI, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
import uvicorn

from .database import engine, SessionLocal
from . import models
from .routers import packages, auth, qr
from .auth import create_initial_users

# Создаем таблицы в базе данных
models.Base.metadata.create_all(bind=engine)

# Создаем начальных пользователей
db = SessionLocal()
create_initial_users(db)
db.close()

app = FastAPI(title="Package Tracking System")

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(packages.router)
app.include_router(qr.router)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 