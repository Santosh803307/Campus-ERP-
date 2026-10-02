# Campus ERP - Phase 1

Phase 1 includes:

- Next.js frontend
- FastAPI backend
- PostgreSQL
- Redis
- SQLAlchemy
- Alembic
- Environment configuration
- CORS
- Health check API
- Frontend -> Backend API connection

## Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

API:
http://127.0.0.1:8000

Swagger:
http://127.0.0.1:8000/docs

Health:
http://127.0.0.1:8000/api/health/

## PostgreSQL

```bash
brew install postgresql@16
brew services start postgresql@16
createdb campus_erp
```

## Redis

```bash
brew install redis
brew services start redis
redis-cli ping
```

Expected:
PONG

## Frontend

Create the Next.js app in the frontend directory using:

```bash
npx create-next-app@latest frontend
```

Recommended:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- src/: Yes
- App Router: Yes
- Turbopack: Yes

Then copy the supplied `src` files into the generated frontend.

Install:

```bash
npm install axios
npm run dev
```

Frontend:
http://localhost:3000

## Important

Do not commit `.env` or `.env.local` to GitHub.

Phase 2 will add authentication, users, students, JWT and role-based access control.
