# Oficios MZ

A React web application concept for connecting local service workers with customers in Mendoza, Argentina.

The project explores separate worker and client experiences, with user registration, profile details, dashboards, and document uploads.

## Product areas

- Supabase authentication and protected routes
- Worker registration and profile management
- Worker and client dashboards
- Document and photo uploads through Supabase Storage
- Reusable interface components and in-app notifications

## Technology

- React 18 and React Router
- Supabase Auth, Database, and Storage
- Tailwind CSS
- Vite

## Run locally

Requirements: Node.js and npm.

```bash
git clone https://github.com/josedaminato/OficiosMZ.git
cd OficiosMZ
npm install
cp env.example .env
```

Replace the placeholders in `.env` with your own Supabase project values and any optional integration credentials. The committed template contains placeholders only; local environment files are ignored by Git.

Start the development server with `npm run dev`. Build the production bundle with `npm run build`.

