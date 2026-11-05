# Twelve Trips

A full-stack travel-booking app: browse past group trips, view the next trip (Japan, Nov 14-24, 2026), create an account and book seats. Built from my own Figma design.

**Concept project.** No real payments are taken, no emails are sent, and the trips/prices are sample data. Colour cards stand in for photos.

## Stack
- **Frontend:** React 18, Vite, React Router, Vitest + Testing Library
- **Backend:** Node 22, Express, SQLite (better-sqlite3), JWT auth, bcrypt, express-rate-limit
- **Tests:** 7 API tests (node:test + supertest), 8 client tests

## What the backend does
- Passwords hashed with bcrypt (cost 12); login is rate-limited and uses a constant-time dummy compare for unknown emails
- JWT (HS256, 2 h); the server refuses to start without `JWT_SECRET` (32+ chars)
- Price is **calculated on the server**, never trusted from the client
- Seat capacity is checked inside a database transaction (no overbooking)
- All input validated; field errors are returned and shown next to each input

## Run locally
```bash
cd server && npm install
JWT_SECRET="$(openssl rand -base64 36)" npm start      # API on :5050

cd client && npm install
npm run dev                                           # app on :5173 (proxies /api)
```
Tests: `npm test` in `server/` and in `client/`.

## Deploy as one service
```bash
cd client && npm install && npm run build
cd ../server && npm install && JWT_SECRET=... node src/index.js
```
The server serves `client/dist` when it exists. Works on Render/Railway/Fly (set `JWT_SECRET`; use a persistent disk for `DB_FILE`).

## API
| Method | Path | Auth |
|---|---|---|
| GET | /api/health | no |
| GET | /api/trips?status=past\|upcoming | no |
| GET | /api/trips/:slug | no |
| POST | /api/auth/signup, /api/auth/login | no |
| POST | /api/bookings | yes |
| GET | /api/bookings/mine | yes |

## Known limits
- Token is kept in `sessionStorage` (simple, but an httpOnly cookie would be safer)
- No password reset, email verification or admin panel
- SQLite file storage: fine for a demo, use Postgres for real traffic
