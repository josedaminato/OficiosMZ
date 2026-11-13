# Oficios MZ

Oficios MZ is a full-stack prototype for connecting customers with local service professionals in Mendoza, Argentina. It brings together worker and client experiences in a single web platform.

## Product areas

- Role-based worker and client registration, profiles, and dashboards
- Service discovery, search, and geolocation
- Document and photo uploads
- Payment and dispute workflows
- Messaging and notifications
- Administrative analytics and reporting

## Technology

- Frontend: React 19, JavaScript/TypeScript, React Router, Vite, and Tailwind CSS
- Backend: Python and FastAPI
- Data and services: Supabase, Redis
- Quality: Vitest, Testing Library, pytest

## Run locally

### Frontend

Requirements: Node.js and npm.

```bash
git clone https://github.com/josedaminato/OficiosMZ.git
cd OficiosMZ
npm install
cp env.example .env
```

Set the local Supabase and integration values in `.env`. The committed template uses placeholders; local environment files are ignored by Git.

```bash
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
npm run type-check
npm run build
```

### Backend

Install the Python dependencies listed in `backend/requirements.txt`, then follow the backend entry-point instructions in `backend/README.md`. Keep service credentials in a local environment file and never commit real keys.

This repository is a product prototype. The listed modules describe the project’s implementation areas and should not be read as a claim of a publicly deployed production service.
