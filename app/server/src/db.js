import Database from 'better-sqlite3';

const PAST = [
  ['turkey', 'Turkey', '2026-01'], ['georgia', 'Georgia', '2026-02'], ['azerbaijan', 'Azerbaijan', '2026-03'],
  ['maldives', 'Maldives', '2026-04'], ['thailand', 'Thailand', '2026-05'], ['malaysia', 'Malaysia', '2026-06'],
  ['switzerland', 'Switzerland', '2026-07'], ['italy', 'Italy', '2026-08'], ['france', 'France', '2026-09'],
  ['spain', 'Spain', '2026-10'],
];

const JAPAN_EXPERIENCES = [
  ['Senso-ji and Asakusa', 'Tokyo'], ['Shibuya and Harajuku', 'Tokyo'], ['teamLab digital art', 'Tokyo'],
  ['Fushimi Inari hike', 'Kyoto'], ['Arashiyama bamboo', 'Kyoto'], ['Nara Park and deer', 'Nara'],
  ['Dotonbori food night', 'Osaka'], ['Osaka Castle', 'Osaka'],
];

export function openDb(file = ':memory:') {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS trips (
      slug TEXT PRIMARY KEY,
      country TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('past','upcoming')),
      month TEXT,
      start_date TEXT,
      end_date TEXT,
      price_sar INTEGER,
      capacity INTEGER,
      cities TEXT,
      summary TEXT
    );
    CREATE TABLE IF NOT EXISTS experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_slug TEXT NOT NULL REFERENCES trips(slug),
      title TEXT NOT NULL,
      city TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      trip_slug TEXT NOT NULL REFERENCES trips(slug),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      seats INTEGER NOT NULL CHECK (seats BETWEEN 1 AND 6),
      notes TEXT,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('card','transfer')),
      total_sar INTEGER NOT NULL,
      reference TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  seed(db);
  return db;
}

function seed(db) {
  const has = db.prepare('SELECT COUNT(*) AS n FROM trips').get().n;
  if (has) return;
  const insTrip = db.prepare(`INSERT INTO trips (slug,country,status,month,start_date,end_date,price_sar,capacity,cities,summary)
    VALUES (@slug,@country,@status,@month,@start_date,@end_date,@price_sar,@capacity,@cities,@summary)`);
  const insExp = db.prepare('INSERT INTO experiences (trip_slug,title,city) VALUES (?,?,?)');
  db.transaction(() => {
    for (const [slug, country, month] of PAST) {
      insTrip.run({ slug, country, status: 'past', month, start_date: null, end_date: null, price_sar: null, capacity: null, cities: null, summary: null });
    }
    insTrip.run({
      slug: 'japan', country: 'Japan', status: 'upcoming', month: '2026-11',
      start_date: '2026-11-14', end_date: '2026-11-24', price_sar: 9000, capacity: 24,
      cities: 'Tokyo,Kyoto,Osaka',
      summary: 'Return flights, a four-star hotel, daily breakfast and eight pre-booked experiences, for one fixed price.',
    });
    for (const [title, city] of JAPAN_EXPERIENCES) insExp.run('japan', title, city);
  })();
}
