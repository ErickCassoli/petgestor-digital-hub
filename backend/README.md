# PetGestor Backend

FastAPI backend for the PetGestor Digital Hub. Provides authentication, scheduling, billing, inventory, and reporting services.

## Quick start

1. Create a Python 3.11+ virtualenv.
2. Install dependencies:
   `ash
   pip install -e .
   `
3. Copy .env.example to .env and adjust settings.
4. Run database migrations with Alembic (instructions pending).
5. Start the API:
   `ash
   uvicorn app.main:app --reload
   `

## Project layout

- pp/core – configuration and security helpers
- pp/db – database engine, base classes, ORM models
- pp/models – SQLAlchemy models
- pp/schemas – Pydantic schemas (to be filled)
- pp/api – API routers
- pp/services – domain services (reports, subscriptions, mail)

Implementation is in progress as part of the Supabase to FastAPI migration.
