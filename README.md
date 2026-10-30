# Rider

A food delivery rider app for Android, iOS, and web. Riders sign in, see the orders assigned to them, accept one, mark it picked up, and mark it delivered.

- `app/` is the Expo app (SDK 57, Expo Router, React Native Paper).
- `api/` is the order source (Express, Prisma, PostgreSQL, Zod, JWT).

## Requirements

- Node 22.13.x (`fnm use 22.13.1`)
- PostgreSQL. If you don't have one, `npm run db:local` in `api/` starts a dev-only embedded PostgreSQL on port 55491.

## Run locally

```bash
# 1. API
cd api
npm install
cp .env.example .env          # set JWT_SECRET; DATABASE_URL already points at the local DB
npm run db:local              # terminal 1: local PostgreSQL (skip if you use your own)
npx prisma migrate deploy     # terminal 2
npm run build
npm run seed                  # idempotent; re-run any time to reset the demo orders
npm start                     # http://0.0.0.0:4791, health check at /health

# 2. App
cd ../app
npm install
cp .env.example .env          # EXPO_PUBLIC_API_URL=http://localhost:4791
npx expo start --web --port 8791
```

On a phone or emulator, set `EXPO_PUBLIC_API_URL` to an address the device can reach: `http://10.0.2.2:4791` on the Android emulator, or `http://<your-LAN-IP>:4791` on a physical phone.

Web export: `npx expo export --platform web` (output in `app/dist`).

## Demo accounts

Both use the password `rider123`.

| Account | Seeded state |
| --- | --- |
| maya@rider.test | 3 new orders, no active order, 2 delivered |
| ravi@rider.test | 1 new order, 1 order picked up (active), 1 delivered |

## API

All `/orders` routes need `Authorization: Bearer <token>` from a rider account.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Checks the database connection |
| POST | `/auth/sign-in` | `{ email, password }` returns `{ token, user }` |
| GET | `/auth/me` | Current rider |
| GET | `/orders/available` | Orders assigned to you and waiting to be accepted |
| GET | `/orders/active` | Your accepted or picked-up order, or `null` |
| GET | `/orders/history` | Your delivered orders with count and earnings |
| POST | `/orders/:id/accept` | `ASSIGNED` to `ACCEPTED` |
| POST | `/orders/:id/pickup` | `ACCEPTED` to `PICKED_UP` |
| POST | `/orders/:id/deliver` | `PICKED_UP` to `DELIVERED` |

Rules:

- A rider can only change orders assigned to them. Anyone else's order returns 403.
- A rider has at most one active order. Accepting a second one returns 409.
- A status change from the wrong status returns 409.

## Deploying the API

- Build command: `npm install && npm run build` (the build runs `prisma generate`).
- Start command: `npx prisma migrate deploy && npm start`.
- Set `DATABASE_URL`, `JWT_SECRET`, and optionally `CORS_ORIGIN`. The server listens on `0.0.0.0:$PORT`.
