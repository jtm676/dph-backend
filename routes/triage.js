const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { triageBySymptoms, explainDiagnosis } = require('../services/ai');
const { pool } = require('../db/queries');
const router = express.Router();

const upload = multer({ dest: 'uploads/prescriptions/', limits: { fileSize: 10*1024*1024 } });

router.post('/symptoms', authenticateToken, async (req, res) => {
  const { symptoms, payerType, bodyPart, duration, intensity } = req.body;
  if (!symptoms) return res.status(400).json({ error: 'Symptome erforderlich.' });
  try {
    const result = await triageBySymptoms({ symptoms, payerType: payerType||'selbstzahler', bodyPart, duration, intensity: parseInt(intensity)||5 });
    try {
      await pool.query('INSERT INTO triage_results (patient_id,symptoms,body_part,duration,intensity,payer_type,recommended_path,icd10_verdacht,konfidenz,behandlungsplan,red_flags,raw_response) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
        [req.user.id, symptoms, bodyPart, duration, intensity||5, payerType||'selbstzahler', result.empfohlener_pfad, result.icd10_verdacht, result.konfidenz, result.behandlungsplan, result.red_flags||[], result]);
    } catch(dbErr) { console.error('DB save error:', dbErr.message); }
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

router.post('/explain-diagnosis', authenticateToken, async (req, res) => {
  const { icd10Code } = req.body;
  if (!icd10Code) return res.status(400).json({ error: 'ICD-10 Code erforderlich.' });
  try {
    const result = await explainDiagnosis(icd10Code, req.user.first_name || 'Patient');
    return res.json(result);
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;
