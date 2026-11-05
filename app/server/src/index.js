import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import { createApp } from './app.js';
import { openDb } from './db.js';

const db = openDb(process.env.DB_FILE || './data.sqlite');
const app = createApp(db, { jwtSecret: process.env.JWT_SECRET, corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173' });

// In production the API also serves the built React app (one service to deploy).
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = Number(process.env.PORT || 5050);
app.listen(port, () => console.log(`Twelve Trips on http://localhost:${port}`));
