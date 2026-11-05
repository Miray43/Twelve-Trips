import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';

const SECRET = 'x'.repeat(40);
const mk = (opts = {}) => createApp(openDb(':memory:'), { jwtSecret: SECRET, ...opts });
const valid = (o = {}) => ({ tripSlug: 'japan', firstName: 'Mira', lastName: 'Al Harbi', phone: '+966501234567', email: 'mira@example.com', seats: 2, paymentMethod: 'card', acceptedTerms: true, ...o });

async function login(app, email = 'a@example.com') {
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
  return r.body.token;
}

test('refuses to start with a weak secret', () => {
  assert.throws(() => createApp(openDb(':memory:'), { jwtSecret: 'short' }));
});

test('lists trips and returns Japan with experiences', async () => {
  const app = mk();
  const all = await request(app).get('/api/trips');
  assert.equal(all.body.length, 11);
  const past = await request(app).get('/api/trips?status=past');
  assert.equal(past.body.length, 10);
  const japan = await request(app).get('/api/trips/japan');
  assert.equal(japan.status, 200);
  assert.equal(japan.body.experiences.length, 8);
  assert.equal(japan.body.priceSar, 9000);
  assert.equal((await request(app).get('/api/trips/mars')).status, 404);
});

test('signup hashes the password and login works', async () => {
  const app = mk();
  assert.equal((await request(app).post('/api/auth/signup').send({ email: 'bad', password: 'password123' })).status, 400);
  assert.equal((await request(app).post('/api/auth/signup').send({ email: 'a@example.com', password: 'short' })).status, 400);
  const ok = await request(app).post('/api/auth/signup').send({ email: 'a@example.com', password: 'password123' });
  assert.equal(ok.status, 201);
  assert.equal((await request(app).post('/api/auth/signup').send({ email: 'A@example.com', password: 'password123' })).status, 409);
  assert.equal((await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'wrongpass' })).status, 401);
  const l = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'password123' });
  assert.equal(l.status, 200);
  assert.ok(l.body.token);
});

test('login is rate limited', async () => {
  const app = mk({ rateLimitMax: 3 });
  let last;
  for (let i = 0; i < 5; i++) last = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'whatever1' });
  assert.equal(last.status, 429);
});

test('booking needs a login and validates input', async () => {
  const app = mk();
  assert.equal((await request(app).post('/api/bookings').send(valid())).status, 401);
  const token = await login(app);
  const bad = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(valid({ email: 'nope', seats: 0, acceptedTerms: false }));
  assert.equal(bad.status, 400);
  assert.ok(bad.body.fields.email && bad.body.fields.seats && bad.body.fields.acceptedTerms);
  const past = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(valid({ tripSlug: 'turkey' }));
  assert.equal(past.status, 404);
});

test('total is computed on the server and seats are limited', async () => {
  const app = mk();
  const token = await login(app);
  const ok = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send({ ...valid({ seats: 3 }), totalSar: 1 });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.totalSar, 27000);
  assert.match(ok.body.reference, /^TT-[0-9A-F]{8}$/);
  assert.equal((await request(app).get('/api/trips/japan')).body.seatsLeft, 21);
  const mine = await request(app).get('/api/bookings/mine').set('Authorization', `Bearer ${token}`);
  assert.equal(mine.body.length, 1);
  // fill the trip: 21 left => 3 more bookings of 6 and one of 3
  for (let i = 0; i < 3; i++) await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(valid({ seats: 6 }));
  await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(valid({ seats: 3 }));
  const full = await request(app).post('/api/bookings').set('Authorization', `Bearer ${token}`).send(valid({ seats: 1 }));
  assert.equal(full.status, 409);
});

test('users only see their own bookings', async () => {
  const app = mk();
  const a = await login(app, 'a@example.com');
  const b = await login(app, 'b@example.com');
  await request(app).post('/api/bookings').set('Authorization', `Bearer ${a}`).send(valid());
  const mineB = await request(app).get('/api/bookings/mine').set('Authorization', `Bearer ${b}`);
  assert.equal(mineB.body.length, 0);
});
