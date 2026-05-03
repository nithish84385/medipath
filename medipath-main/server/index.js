import express from 'express';
import ngrok from '@ngrok/ngrok';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import twilio from 'twilio';
import cron from 'node-cron';
import { handleWhatsAppMessage } from './whatsappAgent.js';
import { getSession, saveSession, readDB, writeDB } from './localDb.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'MediPath WhatsApp Agent is Active' });
});

// WhatsApp Webhook
app.post('/api/whatsapp', async (req, res) => {
  try {
    const { Body, From, To, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    console.log(`[WhatsApp] Message from ${From}: ${Body || '[Media]'}`);

    // Ack Twilio immediately
    res.status(200).end();

    // 1. Get or Create Session
    let sessionData = await getSession(From);

    // 2. Process message through Agent
    const mediaData = NumMedia > 0 ? { url: MediaUrl0, type: MediaContentType0 } : null;
    const response = await handleWhatsAppMessage(From, Body, mediaData);

    // 3. Update History
    sessionData = await getSession(From); // Reload to get updates made by agent
    if (!sessionData) {
      sessionData = { from: From, history: [], lastActive: new Date().toISOString() };
    }
    if (!sessionData.history) {
      sessionData.history = [];
    }
    
    sessionData.history.push({ 
      role: 'user', 
      content: Body || `[Media: ${MediaContentType0}]`, 
      timestamp: new Date().toISOString() 
    });
    sessionData.lastActive = new Date().toISOString();
    
    await saveSession(From, sessionData);

    // 4. Send Response via Twilio
    await twilioClient.messages.create({
      body: response,
      from: To,
      to: From
    });

  } catch (error) {
    console.error('Webhook Error:', error);
  }
});

// Medicine Reminder System (Runs every minute)
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  try {
    const db = await readDB();
    let updated = false;

    for (let i = 0; i < db.reminders.length; i++) {
      const reminder = db.reminders[i];
      if (reminder.time === timeStr && !reminder.sent) {
        console.log(`Sending reminder to ${reminder.phone}: ${reminder.medicine}`);
        
        await twilioClient.messages.create({
          body: `🔔 *Medication Reminder*\n\nHi! It's time to take your *${reminder.medicine}*. \n\nStay healthy! ❤️`,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: reminder.phone
        });

        db.reminders[i].sent = true;
        updated = true;
      }
    }

    if (updated) {
      await writeDB(db);
    }
  } catch (e) {
    console.error('Cron Error:', e);
  }
});

const PORT = process.env.PORT || 3001;

async function startTunnel() {
  try {
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken: process.env.NGROK_AUTHTOKEN,
    });
    const url = listener.url();
    console.log(`\x1b[36m%s\x1b[0m`, `\n🌐 TUNNEL LIVE! Paste this into Twilio:\n👉  ${url}/api/whatsapp\n`);
  } catch(e) {
    console.error('ngrok error:', e.message);
    console.log('\n⚠️  Add NGROK_AUTHTOKEN to .env file (free at ngrok.com)\n');
  }
}

app.listen(PORT, () => {
  console.log(`\x1b[32m%s\x1b[0m`, `🚀 MediPath WhatsApp Agent running on port ${PORT}`);
  startTunnel();
});
