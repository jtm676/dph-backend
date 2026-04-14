const OpenAI = require('openai');
const logger = require('../utils/logger');

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function triageBySymptoms({ symptoms, payerType, bodyPart, duration, intensity }) {
  const client = getClient();
  const prompt = `Du bist ein KI-Assistent fuer digitale Physiotherapie.
Patient: Symptome: ${symptoms}, Koerperteil: ${bodyPart}, Dauer: ${duration}, Intensitaet: ${intensity}/10, Kassentyp: ${payerType}
Analysiere und gib JSON zurueck: { "empfohlener_pfad": "gkv|pkv|diga|selbstzahler", "konfidenz": 0-100, "icd10_verdacht": "Code", "behandlungsplan": "Plan", "red_flags": ["Flag1"], "video_quote": "Motivationssatz", "naechster_schritt": "Schritt", "diga_empfehlung": "App oder null" }`;
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });
  return JSON.parse(response.choices[0].message.content);
}

async function generateDoctorLetter({ letterType, patientName, diagnosis, therapistName, additionalInfo }) {
  const client = getClient();
  const types = { diga: 'DiGA-Verordnung', followup: 'Folgeverordnung', discharge: 'Entlassbrief', referral: 'Einweisung' };
  const prompt = `Erstelle einen professionellen ${types[letterType] || letterType} fuer Patient ${patientName}.
Therapeut: ${therapistName}, Diagnose: ${diagnosis}, Zusatz: ${additionalInfo || '-'}
JSON: { "formatted_text": "vollstaendiger Brief", "quality_score": 0-100, "missing_fields": [] }`;
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 1500,
  });
  return JSON.parse(response.choices[0].message.content);
}

async function explainDiagnosis(icd10Code, patientFirstName) {
  const client = getClient();
  const prompt = `Erklaere dem Patienten ${patientFirstName} die Diagnose ${icd10Code} in einfacher Sprache. JSON: { "explanation": "Text", "tips": ["Tipp1","Tipp2"] }`;
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 600,
  });
  return JSON.parse(response.choices[0].message.content);
}

module.exports = { triageBySymptoms, generateDoctorLetter, explainDiagnosis };
