# Campus Pulse frontend

React + Vite event portal based on the browse-events design in `../design`.

## Start locally

```sh
npm install
npm run dev
```

The frontend uses `https://event-80ny.onrender.com` by default. To point it at another backend, copy `.env.example` to `.env` and set `VITE_API_URL`.

Browse events calls `GET /api/events`. The demo role/email selectors call `GET /api/demo/emails?role=...`, which reads existing `users.email` and `users.role` records through the backend. Registration sends the selected email and role to `POST /api/registrations`; the backend resolves the matching `users.id` and writes the existing `registrations.user_id` and `registrations.event_id` fields. My Tickets uses `GET /api/me/registrations?email=...`. Role and email are saved in local storage. The backend does not create attendee accounts, so only existing database emails appear. Role options map to existing database roles: Student → `student`/`attendee`, Administrator → `administrator`/`admin`, and Organization → `organization`/`organizer`.

## Deploy to Vercel

Import the repository root so Vercel reads the root `vercel.json`. It defines two services: the Flask backend in `backend` and this Vite frontend in `Frontend`. The frontend builds with `npm run build` and publishes `dist`. Vercel routes `/api/*` to Flask and all other paths to this frontend.

Configure these existing backend environment variables in Vercel Project Settings for Production and Preview:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
```

The frontend uses the existing Render backend URL by default in both local development and Vercel. Set `VITE_API_URL` only if you want the frontend to call a different public backend URL. The Flask service in this repository is also exposed through Vercel's `/api/*` route and needs `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` configured in Vercel.
