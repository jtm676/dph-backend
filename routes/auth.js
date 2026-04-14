const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { z } = require('zod');
const { pool } = require('../db/queries');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  role: z.enum(['patient','therapist']).default('patient'),
  payer_type: z.enum(['gkv','pkv','selbstzahler']).optional(),
});

router.post('/register', async (req, res) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Validierungsfehler', details: parse.error.flatten() });
  const { email, password, first_name, last_name, role, payer_type } = parse.data;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'E-Mail bereits registriert.' });
    const password_hash = await bcrypt.hash(password, 12);
    const id = uuid();
    await pool.query('BEGIN');
    await pool.query('INSERT INTO users (id,email,password_hash,role,first_name,last_name) VALUES ($1,$2,$3,$4,$5,$6)', [id,email,password_hash,role,first_name,last_name]);
    if (role === 'patient') await pool.query('INSERT INTO patients (id,payer_type) VALUES ($1,$2)', [id, payer_type||'selbstzahler']);
    else if (role === 'therapist') await pool.query('INSERT INTO therapists (id) VALUES ($1)', [id]);
    await pool.query('COMMIT');
    const token = jwt.sign({ id, email, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: { id, email, role, first_name, last_name } });
  } catch (err) { await pool.query('ROLLBACK'); return res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort erforderlich.' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1 AND is_active=TRUE', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Ungueltige Anmeldedaten.' });
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Ungueltige Anmeldedaten.' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id,email,role,first_name,last_name,created_at FROM users WHERE id=$1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
    return res.json(rows[0]);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;
