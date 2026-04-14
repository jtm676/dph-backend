const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateDoctorLetter } = require('../services/ai');
const { pool } = require('../db/queries');
const router = express.Router();

router.post('/generate', authenticateToken, requireRole(['therapist','admin']), async (req, res) => {
  const { letterType, patientName, diagnosis, additionalInfo } = req.body;
  if (!letterType || !patientName || !diagnosis) return res.status(400).json({ error: 'Brieftyp, Patientenname und Diagnose erforderlich.' });
  try {
    const therapistName = req.user.first_name + ' ' + req.user.last_name;
    const result = await generateDoctorLetter({ letterType, patientName, diagnosis, therapistName, additionalInfo });
    try {
      await pool.query('INSERT INTO doctor_letters (therapist_id,patient_name,letter_type,diagnosis,formatted_text,raw_response) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.user.id, patientName, letterType, diagnosis, result.formatted_text, result]);
    } catch(dbErr) { console.error('DB save error:', dbErr.message); }
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;
