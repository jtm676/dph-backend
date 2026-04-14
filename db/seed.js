const { pool } = require('./queries');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const users = [
  { email: 'admin@dph.de', first_name: 'Admin', last_name: 'DPH', role: 'admin' },
  { email: 'patient@dph.de', first_name: 'Max', last_name: 'Mustermann', role: 'patient', payer_type: 'gkv' },
  { email: 'anna.bergmann@dph.de', first_name: 'Anna', last_name: 'Bergmann', role: 'therapist' },
  { email: 'max.schreiber@dph.de', first_name: 'Max', last_name: 'Schreiber', role: 'therapist' },
];

async function seed() {
  const hash = await bcrypt.hash('DemoPass123!', 12);
  for (const u of users) {
    const id = uuid();
    try {
      await pool.query(
        'INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING',
        [id, u.email, hash, u.role, u.first_name, u.last_name]
      );
      const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [u.email]);
      const uid = rows[0].id;
      if (u.role === 'patient') {
        await pool.query('INSERT INTO patients (id, payer_type) VALUES ($1,$2) ON CONFLICT DO NOTHING', [uid, u.payer_type || 'selbstzahler']);
      } else if (u.role === 'therapist') {
        await pool.query('INSERT INTO therapists (id, specializations, bio, hourly_rate, is_verified, location) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
          [uid, ['Rcken','Schulter'], 'Erfahrene Physiotherapeutin mit 10 Jahren Erfahrung.', 95.00, true, 'Berlin']);
      }
      console.log('Seed:', u.email);
    } catch (e) { console.error(u.email, e.message); }
  }
  await pool.end();
  console.log('Seed abgeschlossen');
}

seed().catch(console.error);
