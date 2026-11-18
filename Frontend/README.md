# Campus Pulse frontend

React + Vite event portal based on the browse-events design in `../design`.

## Start locally

```sh
npm install
npm run dev
```

The frontend uses `https://event-80ny.onrender.com` by default. To point it at another backend, copy `.env.example` to `.env` and set `VITE_API_URL`.

Browse events calls `GET /api/events`. Registration opens a form for the attendee email and calls `POST /api/registrations`; the backend looks up the corresponding existing attendee ID in the `users` table. My Tickets uses `GET /api/me/registrations?email=...`. Email is saved in local storage. The backend does not create attendee accounts, so the email must already exist in its `users` table.

## Deploy to Vercel

This repository also contains the backend, so set Vercel's **Root Directory** to `Frontend` when importing the repository. Vercel will use `vercel.json` to build with `npm run build` and publish `dist`.

In the Vercel project settings, add this environment variable for Production (and Preview if desired):

```text
VITE_API_URL=https://event-80ny.onrender.com
```

Vite embeds `VITE_API_URL` during the build, so redeploy after changing it. The frontend already falls back to this backend URL when the variable is unset.
