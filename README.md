# Система отслеживания посылок

REST API приложение для отслеживания посылок, разработанное с использованием FastAPI и PostgreSQL.

## Функциональность

- Создание и управление посылками
- Отслеживание статуса посылок
- История перемещений посылок
- Веб-интерфейс для отслеживания

## Технологии

- FastAPI
- PostgreSQL
- SQLAlchemy
- Docker
- Docker Compose

## Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/post10/tracking_system.git
cd tracking_system
```

2. Запустите приложение с помощью Docker Compose:
```bash
docker-compose up --build
```

3. Откройте веб-интерфейс:
```
http://localhost:8000
```

4. API документация доступна по адресу:
```
http://localhost:8000/docs
```

## Структура проекта

```
tracking_system/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── routers/
│   │   ├── __init__.py
│   │   └── packages.py
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── main.js
│   └── templates/
│       └── index.html
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .dockerignore
``` 