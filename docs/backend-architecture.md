# Backend Architecture Overview

## Technology stack

- FastAPI for the HTTP layer
- SQLAlchemy 2.0 (async engine) for data access
- Alembic for migrations
- JWT (python-jose) for authentication tokens
- Stripe SDK for subscription management
- Optional SMTP integration for transactional e-mails

## Module layout

- pp/core – configuration (Settings) and security helpers (password hashing, JWT helpers)
- pp/db – async session factory, declarative base, Alembic integration
- pp/models – ORM models covering users, profiles, CRM entities, sales, billing, and support tables
- pp/schemas – Pydantic models shared by request/response payloads
- pp/api/routes – FastAPI routers grouped by feature (auth, clients, pets, sales, reports, subscription, dashboard)
- pp/services – domain services (reports, Stripe, mailing) to keep routers thin

## Data model (draft)

| Table | Purpose |
| ----- | ------- |
| users | Authentication identity with hashed password and flags |
| profiles | User profile metadata (name, role, trial, subscription toggle) |
| clients | Pet owner records |
| pets | Pets linked to clients and users |
| services | Grooming/veterinary services catalog |
| products | Inventory items with stock control |
| ppointments | Scheduling entries referencing pets/services |
| invoices | Invoices generated from appointments |
| invoice_items | Line items for invoices (service-based) |
| sales | POS sales summary entries |
| sale_items | POS sale line items (product/service) |
| password_reset_tokens | Password reset workflow state |

Stripe subscription state is retrieved on demand via the API rather than persisted locally (except for an is_subscribed hint on profiles).

## API surface (work in progress)

- POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout
- GET/PATCH /profiles/me
- CRUD endpoints for clients, pets, services, products
- GET/POST/PATCH/DELETE /appointments including invoice generation (POST /appointments/{id}/invoice)
- GET /sales, POST /sales, GET /sales/{id}, DELETE /sales/{id}
- POST /reports to generate revenue/service/product/client/appointment reports
- GET /subscription/prices, POST /subscription/checkout, GET /subscription/status
- GET /dashboard/metrics for aggregated cards

This document will be refined as endpoints are implemented.
