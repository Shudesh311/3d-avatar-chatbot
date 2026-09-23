# AI Voice 3D Avatar

React frontend plus Django framework / PostgreSQL backend for an AI voice chatbot with a 3D avatar.

## Project structure

```text
backend/   Django framework API and PostgreSQL connection
frontend/  React + Vite 3D avatar chat UI
```

## PostgreSQL

The backend is configured for:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "**********",
        "USER": "*******",
        "PASSWORD": "****",
        "HOST": "**",
        "PORT": "*******",
    }
}
```

Create the database before running migrations:

```powershell
createdb -U postgres ai_voice_3d_avatar
```

If `createdb` is not available, create the database from pgAdmin with the name `ai_voice_3d_avatar`.

## Backend setup (Django Framework)

```powershell
cd "C:\Users\SHUDESH\Desktop\3d avatar\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py seed_knowledge
python manage.py runserver 
```

Or double-click `start-backend.bat` in the root folder.

Put your API keys in `backend\.env`:

```text
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=**************
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
```

API endpoints (Port 8000):

```text
GET  http://localhost:8000/api/health/
GET  http://localhost:8000/api/knowledge/
POST http://localhost:8000/api/chat/
POST http://localhost:8000/api/tts/
```

## Frontend setup

```powershell
cd "C:\Users\SHUDESH\Desktop\3d avatar\frontend"
npm install
npm run dev
```

Or double-click `start-frontend.bat` in the root folder.

Frontend environment configuration (`frontend\.env`):

```text
VITE_USE_BACKEND=1
VITE_API_BASE_URL=http://localhost:8000/api
```

Open in browser:

```text
http://localhost:5173
```

## Features

- **Django Backend**: Complete REST API managing dataset, chat interactions, and text-to-speech payloads.
- **3D Avatar & Canvas**: Interactive 3D scene built with Three.js / React Three Fiber.
- **Lip-Sync Audio & Animation**: Syncs avatar mouth morph targets with text-to-speech cues.
- **Knowledge Base Dataset**: Built-in dataset matching with fallback to OpenAI API.
