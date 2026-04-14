const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../db/queries');
const router = express.Router();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT u.id,u.email,u.first_name,u.last_name,u.created_at,p.payer_type,p.phone,p.address FROM users u LEFT JOIN patients p ON u.id=p.id WHERE u.id=$1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Patient nicht gefunden.' });
    return res.json(rows[0]);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;
