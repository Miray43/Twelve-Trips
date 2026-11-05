import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ]{9,15}$/;
const NAME_RE = /^[\p{L} '-]{1,60}$/u;

export function createApp(db, { jwtSecret, corsOrigin = 'http://localhost:5173', rateLimitMax = 20 } = {}) {
  if (!jwtSecret || jwtSecret.length < 32) throw new Error('JWT_SECRET must be set and at least 32 characters');
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: rateLimitMax, standardHeaders: true, legacyHeaders: false });
  const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

  const sign = (user) => jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { algorithm: 'HS256', expiresIn: '2h' });

  function requireAuth(req, res, next) {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Login required' });
    try {
      const p = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      req.user = { id: p.sub, email: p.email };
      next();
    } catch {
      res.status(401).json({ error: 'Session expired, please log in again' });
    }
  }

  const seatsTaken = db.prepare('SELECT COALESCE(SUM(seats),0) AS n FROM bookings WHERE trip_slug = ?');
  const tripOut = (t) => ({
    slug: t.slug, country: t.country, status: t.status, month: t.month,
    startDate: t.start_date, endDate: t.end_date, priceSar: t.price_sar, capacity: t.capacity,
    cities: t.cities ? t.cities.split(',') : [], summary: t.summary,
    seatsLeft: t.capacity ? t.capacity - seatsTaken.get(t.slug).n : null,
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/trips', (req, res) => {
    const { status } = req.query;
    const rows = status === 'past' || status === 'upcoming'
      ? db.prepare('SELECT * FROM trips WHERE status = ? ORDER BY month').all(status)
      : db.prepare('SELECT * FROM trips ORDER BY month').all();
    res.json(rows.map(tripOut));
  });

  app.get('/api/trips/:slug', (req, res) => {
    const t = db.prepare('SELECT * FROM trips WHERE slug = ?').get(req.params.slug);
    if (!t) return res.status(404).json({ error: 'Trip not found' });
    const experiences = db.prepare('SELECT title, city FROM experiences WHERE trip_slug = ? ORDER BY id').all(t.slug);
    res.json({ ...tripOut(t), experiences });
  });

  app.post('/api/auth/signup', authLimiter, (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 120) return res.status(400).json({ error: 'Enter a valid email' });
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Password must be 8 to 72 characters' });
    const hash = bcrypt.hashSync(password, 12);
    try {
      const info = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email.toLowerCase(), hash);
      const user = { id: Number(info.lastInsertRowid), email: email.toLowerCase() };
      res.status(201).json({ token: sign(user), user: { email: user.email } });
    } catch (e) {
      if (String(e.code).startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ error: 'An account with this email already exists' });
      throw e;
    }
  });

  app.post('/api/auth/login', authLimiter, (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required' });
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    const ok = bcrypt.compareSync(password, row ? row.password_hash : DUMMY_HASH);
    if (!row || !ok) return res.status(401).json({ error: 'Wrong email or password' });
    res.json({ token: sign(row), user: { email: row.email } });
  });

  app.post('/api/bookings', requireAuth, (req, res) => {
    const b = req.body ?? {};
    const errors = {};
    if (typeof b.firstName !== 'string' || !NAME_RE.test(b.firstName.trim())) errors.firstName = 'Enter the first name as on the passport';
    if (typeof b.lastName !== 'string' || !NAME_RE.test(b.lastName.trim())) errors.lastName = 'Enter the last name as on the passport';
    if (typeof b.phone !== 'string' || !PHONE_RE.test(b.phone.trim())) errors.phone = 'Enter a valid mobile number';
    if (typeof b.email !== 'string' || !EMAIL_RE.test(b.email.trim())) errors.email = 'Enter a valid email';
    if (!Number.isInteger(b.seats) || b.seats < 1 || b.seats > 6) errors.seats = 'Choose 1 to 6 seats';
    if (!['card', 'transfer'].includes(b.paymentMethod)) errors.paymentMethod = 'Choose a payment method';
    if (b.notes != null && (typeof b.notes !== 'string' || b.notes.length > 500)) errors.notes = 'Notes must be under 500 characters';
    if (b.acceptedTerms !== true) errors.acceptedTerms = 'You need to accept the trip terms';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields', fields: errors });

    const trip = db.prepare('SELECT * FROM trips WHERE slug = ?').get(b.tripSlug);
    if (!trip || trip.status !== 'upcoming') return res.status(404).json({ error: 'This trip is not open for booking' });

    const book = db.transaction(() => {
      const left = trip.capacity - seatsTaken.get(trip.slug).n;
      if (b.seats > left) return { full: true, left };
      const total = b.seats * trip.price_sar; // price always computed on the server
      const reference = 'TT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      db.prepare(`INSERT INTO bookings (user_id,trip_slug,first_name,last_name,phone,email,seats,notes,payment_method,total_sar,reference)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(req.user.id, trip.slug, b.firstName.trim(), b.lastName.trim(), b.phone.trim(), b.email.trim().toLowerCase(), b.seats, b.notes?.trim() || null, b.paymentMethod, total, reference);
      return { reference, total };
    })();
    if (book.full) return res.status(409).json({ error: `Only ${book.left} seat(s) left on this trip` });
    res.status(201).json({ reference: book.reference, totalSar: book.total, tripSlug: trip.slug, seats: b.seats, paymentMethod: b.paymentMethod });
  });

  app.get('/api/bookings/mine', requireAuth, (req, res) => {
    const rows = db.prepare(`SELECT b.reference, b.trip_slug AS tripSlug, t.country, b.seats, b.total_sar AS totalSar, b.payment_method AS paymentMethod, b.created_at AS createdAt
      FROM bookings b JOIN trips t ON t.slug = b.trip_slug WHERE b.user_id = ? ORDER BY b.id DESC`).all(req.user.id);
    res.json(rows);
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });
  return app;
}
