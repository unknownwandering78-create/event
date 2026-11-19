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

This repository also contains the backend, so set Vercel's **Root Directory** to `Frontend` when importing the repository. Vercel will use `vercel.json` to build with `npm run build` and publish `dist`.

In the Vercel project settings, add this environment variable for Production (and Preview if desired):

```text
VITE_API_URL=https://event-80ny.onrender.com
```

Vite embeds `VITE_API_URL` during the build, so redeploy after changing it. The frontend already falls back to this backend URL when the variable is unset.
