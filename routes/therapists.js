const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../db/queries');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, t.specializations, t.bio, t.hourly_rate, t.rating, t.review_count, t.is_verified, t.location
      FROM users u JOIN therapists t ON u.id=t.id WHERE u.is_active=TRUE ORDER BY t.rating DESC`);
    return res.json(rows);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT u.id,u.first_name,u.last_name,t.* FROM users u JOIN therapists t ON u.id=t.id WHERE u.id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Therapeut nicht gefunden.' });
    return res.json(rows[0]);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;
