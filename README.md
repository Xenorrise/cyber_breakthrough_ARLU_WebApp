# ARLU WebApp: развертка и запуск

## Что поднимается
- `frontend` (Next.js): `http://localhost:3000`
- `backend` (.NET 8 API + SignalR): `http://localhost:8080`
- `qdrant` (векторная БД): `http://localhost:6333`

Важно: основная доменная БД в backend сейчас `InMemory` (очищается при перезапуске контейнера). Внешняя БД для векторов памяти - Qdrant.

## Требования
- Windows + PowerShell
- Docker
- LM Studio (включен Local Server / OpenAI-compatible API)

## Настройка `.env.local` (LM Studio + Qdrant)
В корне проекта создайте файл `.env.local` (можно скопировать из `.env.local.example`).

Пример для случая с LM Studio:

```env
OPENAI_API_KEY=lm-studio
OPENAI_BASE_URL=http://host.docker.internal:1234
OPENAI_CHAT_BASE_URL=http://host.docker.internal:1234
OPENAI_CHAT_MODEL=openai/gpt-oss-20b
OPENAI_EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5
QDRANT_BASE_URL=http://qdrant:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=memory_logs
```
- `OPENAI_CHAT_MODEL` - имя модели чата, как в LM Studio.
- `OPENAI_EMBEDDING_MODEL` - embedding-модель, которая реально загружена в LM Studio.
- Если LM Studio на другой машине, замените `host.docker.internal` на IP этой машины (например `http://192.168.1.10:1234`).
- `QDRANT_BASE_URL=http://qdrant:6333` правильно для запуска через текущий `docker-compose.yml`.

## Как пользоваться батниками
Запускать из корня проекта: `Proj1/cyber_breakthrough_ARLU_WebApp`.

### `build_and_run.bat`
Собирает образы (контейнеры не стартует).

Команды:
- `build_and_run.bat` - собрать все образы
- `build_and_run.bat rebuild` - собрать все без кэша
- `build_and_run.bat back` - собрать только backend
- `build_and_run.bat front` - собрать только frontend
- `build_and_run.bat back rebuild` - backend без кэша
- `build_and_run.bat front rebuild` - frontend без кэша

### `up_and_run.bat`
Поднимает сервисы в фоне (`docker compose up -d --build`).
- Скрипт требует файл `.env.local` в корне проекта.
- После запуска приложение доступно на `http://localhost:3000`.


## Быстрый сценарий запуска
1. Откройте LM Studio, загрузите chat и embedding модели, включите Local Server на порту `1234`.
2. Заполните `.env.local`.
3. Выполните:

```powershell
.\build_and_run.bat
.\up_and_run.bat
```

4. Откройте `http://localhost:3000`.
