require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('CORS: ' + origin));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 200, message: { error: 'Zu viele Anfragen.' } }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/triage', require('./routes/triage'));
app.use('/api/letters', require('./routes/letters'));
app.use('/api/therapists', require('./routes/therapists'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/bookings', require('./routes/bookings'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'DPH Backend', ts: new Date().toISOString() }));

app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: 'Interner Serverfehler.' });
});

app.listen(PORT, () => logger.info('DPH Backend laeuft auf Port ' + PORT));
