import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import twilio from 'twilio';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from the parent root folder
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const app = express();
// Twilio sends webhooks as application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Initialize Gemini (using your existing VITE_GEMINI_API_KEY)
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || 'PLACEHOLDER');
// We will use gemini-pro for text
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', multimodal: 'enabled' });
});

// Main WhatsApp Webhook
app.post('/api/whatsapp', async (req, res) => {
  try {
    const { Body, From, NumMedia, MediaUrl0, MediaContentType0, To } = req.body;
    console.log(`Received message from ${From}: ${Body}`);

    // IMMEDIATELY acknowledge the webhook to prevent Twilio timeout (15 seconds)
    res.status(200).end();

    let aiResponseText = "";

    // Check if media was sent (Image, Audio, etc)
    if (NumMedia && parseInt(NumMedia) > 0) {
      console.log(`Received Media: ${MediaUrl0} of type ${MediaContentType0}`);
      aiResponseText = `I received your media (${MediaContentType0}). Processing reports/audio will be implemented soon!`;
    } else {
      // It's a text message, let's pass it to Gemini
      const prompt = `
        You are Medipath's AI WhatsApp Assistant. A patient sent this message: "${Body}".
        Identify their intent: 1) reporting symptoms 2) asking for a reminder 3) general health question.
        Reply in the language they used. Keep it brief and friendly.
      `;
      
      try {
        if (process.env.VITE_GEMINI_API_KEY) {
          const result = await model.generateContent(prompt);
          aiResponseText = result.response.text();
        } else {
          aiResponseText = "I received your message! (Add VITE_GEMINI_API_KEY to test AI responses)";
        }
      } catch (e) {
        console.error("Gemini Error:", e);
        aiResponseText = "Sorry, I am having trouble connecting to my AI brain right now.";
      }
    }

    // Send the actual message asynchronously using the Twilio client
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: aiResponseText,
      from: To, // This is the Twilio number (+14155238886)
      to: From  // This is the user's WhatsApp number
    });
    console.log("Response sent to user asynchronously.");

  } catch (error) {
    console.error('Webhook error:', error);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`WhatsApp Agent Server running on port ${PORT}`);
  console.log(`Waiting for Twilio Webhooks on http://localhost:${PORT}/api/whatsapp`);
});
