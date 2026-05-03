import twilio from 'twilio';
import admin from 'firebase-admin';
import { handleWhatsAppMessage } from '../server/whatsappAgent.js';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Body, From, To, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    // 1. Get or Create Session
    const sessionRef = db.collection('whatsapp_sessions').doc(From);
    const sessionSnap = await sessionRef.get();
    
    // 2. Process message
    const mediaData = NumMedia > 0 ? { url: MediaUrl0, type: MediaContentType0 } : null;
    const response = await handleWhatsAppMessage(From, Body, db, mediaData);

    // 3. Update History
    const historyItem = { 
      role: 'user', 
      content: Body || `[Media: ${MediaContentType0}]`, 
      timestamp: new Date().toISOString() 
    };

    if (!sessionSnap.exists) {
      await sessionRef.set({
        from: From,
        history: [historyItem],
        lastActive: new Date().toISOString()
      });
    } else {
      await sessionRef.update({
        history: admin.firestore.FieldValue.arrayUnion(historyItem),
        lastActive: new Date().toISOString()
      });
    }

    // 4. Send Response via Twilio
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilioClient.messages.create({
      body: response,
      from: To,
      to: From
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Vercel Function Error:', error);
    res.status(500).json({ error: error.message });
  }
}
