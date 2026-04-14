const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../db/queries');
const { v4: uuid } = require('uuid');
const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  const { therapist_id, scheduled_at, duration_minutes, notes } = req.body;
  if (!therapist_id || !scheduled_at) return res.status(400).json({ error: 'Therapeut und Zeitpunkt erforderlich.' });
  try {
    const id = uuid();
    await pool.query('INSERT INTO bookings (id,patient_id,therapist_id,scheduled_at,duration_minutes,notes) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, req.user.id, therapist_id, scheduled_at, duration_minutes||60, notes||'']);
    return res.status(201).json({ id, message: 'Buchung erstellt.' });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const col = req.user.role === 'therapist' ? 'b.therapist_id' : 'b.patient_id';
    const { rows } = await pool.query(\`SELECT b.*,u.first_name,u.last_name FROM bookings b JOIN users u ON u.id=(CASE WHEN b.patient_id=$1 THEN b.therapist_id ELSE b.patient_id END) WHERE \${col}=$1 ORDER BY b.scheduled_at DESC\`, [req.user.id]);
    return res.json(rows);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;
