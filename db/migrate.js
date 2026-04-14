const { pool } = require('./queries');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      if (!['42710','42P07','42701'].includes(err.code)) {
        console.error('Migration error:', err.message);
        console.error('Statement:', stmt.substring(0,100));
      }
    }
  }
  console.log('Migration abgeschlossen');
  await pool.end();
}

migrate().catch(console.error);
