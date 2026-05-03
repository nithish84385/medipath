import express from 'express';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory session store
const sessions = {};

const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_NUM = process.env.TWILIO_WHATSAPP_NUMBER;

const LANGS = ['English','Hindi','Telugu','Tamil','Bengali','Marathi','Kannada','Malayalam'];

async function callGemini(prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Please try again.';
  } catch (e) {
    console.error('Gemini error:', e.message);
    return 'I am having trouble connecting. Please try again.';
  }
}

async function sendWhatsApp(to, body) {
  try {
    const creds = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `From=whatsapp:${encodeURIComponent(TWILIO_NUM)}&To=${encodeURIComponent(to)}&Body=${encodeURIComponent(body)}`
      }
    );
    const data = await res.json();
    if (data.sid) console.log(`✅ Sent to ${to}: ${data.sid}`);
    else console.log(`❌ Twilio error:`, data);
  } catch (e) {
    console.error('Send error:', e.message);
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'MediPath WhatsApp Bot is Live! 🏥', version: '2.0' });
});

// WhatsApp Webhook
app.post('/whatsapp', async (req, res) => {
  // Acknowledge immediately so Twilio doesn't timeout
  res.status(200).end();

  const { Body: B, From: F } = req.body;
  console.log(`[${new Date().toISOString()}] MSG from ${F}: ${B}`);

  if (!B || !F) return;

  // Initialize session
  if (!sessions[F]) {
    sessions[F] = { step: 'LANG', lang: 'English', symptoms: '', city: '' };
    await sendWhatsApp(F,
      `🏥 *Welcome to MediPath AI!*\n\nYour personal health assistant is here.\n\nPlease select your language:\n\n` +
      LANGS.map((l, i) => `${i + 1}. ${l}`).join('\n')
    );
    return;
  }

  const s = sessions[F];
  let reply = '';

  switch (s.step) {
    case 'LANG': {
      const i = parseInt(B) - 1;
      s.lang = (i >= 0 && i < LANGS.length) ? LANGS[i] : 'English';
      s.step = 'SYM';
      reply = `✅ Great! We will use *${s.lang}*.\n\nPlease describe your symptoms or health concern:`;
      break;
    }
    case 'SYM': {
      s.symptoms = B;
      s.step = 'CITY';
      reply = `📍 Noted your symptoms. Which *city* are you in? (For doctor recommendations)`;
      break;
    }
    case 'CITY': {
      s.city = B;
      s.step = 'CHAT';
      reply = await callGemini(
        `You are MediPath AI, an expert medical assistant. Respond in ${s.lang}.
        Patient Location: ${s.city}
        Symptoms: ${s.symptoms}
        
        Provide a structured WhatsApp-friendly response with:
        🔍 *Analysis* - Brief symptom analysis
        👨‍⚕️ *Recommended Doctors* - 3 real doctor specialties with example hospital names in ${s.city}
        🥗 *Diet Plan* - Foods to eat and avoid
        🏠 *Home Care* - OTC remedies and rest tips
        
        End by asking if they want to set a medication reminder.
        Use bold, bullet points and emojis for WhatsApp formatting.`
      );
      break;
    }
    case 'CHAT':
    default: {
      reply = await callGemini(
        `You are MediPath AI in ${s.lang}. User is in ${s.city} with symptoms: ${s.symptoms}.
        User message: "${B}"
        Respond helpfully as a medical assistant. Keep it concise for WhatsApp.`
      );
      break;
    }
  }

  if (reply) await sendWhatsApp(F, reply);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 MediPath WhatsApp Bot running on port ${PORT}`);
  console.log(`📡 Webhook URL: YOUR_PUBLIC_URL/whatsapp`);
});
