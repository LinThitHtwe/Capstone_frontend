# Capstone Frontend

Next.js web app for the **Smart Library Table Reservation & IoT Monitoring** Capstone. Provides the public library map, user sign-up / sign-in, table reservation flow, personal reservation history, and the admin console (tables, users, reservations, weight sensors, LCD displays).

## Documentation

Screenshots, hardware photos, and system walkthrough:

**https://github.com/LinThitHtwe/Capstone_documentation**

Related repos:

- Backend: https://github.com/LinThitHtwe/Capstone_backend
- IoT firmware: https://github.com/LinThitHtwe/Capstone_Iot

## Prerequisites

- Node.js 18+ (LTS recommended)
- Running backend API (see Capstone_backend), typically on `http://127.0.0.1:8001`

## Getting started

```bash
git clone https://github.com/LinThitHtwe/Capstone_frontend.git
cd Capstone_frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API URL

By default the browser uses the Next.js rewrite `/django-api/*` → `http://127.0.0.1:8001/api/*` (see `next.config.mjs`).

Optional override:

```bash
# .env.local (gitignored)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run start`| Serve production build   |
| `npm run lint` | ESLint                   |

## Roles

- **Student / lecturer / visitor** — public map, reserve tables, view own history
- **Admin** — console under `/admin` for maps, directories, reservations, and IoT devices
