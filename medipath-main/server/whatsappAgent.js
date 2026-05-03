import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { getSession, saveSession, addReminder } from './localDb.js';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const LANGUAGES = [
  "English", "Hindi (हिंदी)", "Telugu (తెలుగు)", "Tamil (தமிழ்)", 
  "Bengali (বাংলা)", "Marathi (मराठी)", "Kannada (ಕನ್ನಡ)", "Malayalam (മലയാളം)"
];

export async function handleWhatsAppMessage(from, body, mediaData = null) {
  // 1. Load Session from Local DB
  let session = await getSession(from);
  
  // 2. Initialize if new
  if (!session) {
    session = {
      from,
      step: 'LANGUAGE_SELECTION',
      language: 'English',
      userData: {},
      createdAt: new Date().toISOString()
    };
    await saveSession(from, session);
    
    return `Welcome to *MediPath AI*! 🏥 Your personalized health assistant.\n\nPlease select your preferred language to continue:\n\n` + 
           LANGUAGES.map((l, i) => `${i + 1}. ${l}`).join('\n');
  }

  let responseText = "";

  // 3. Handle Media if present
  if (mediaData) {
    responseText = await handleMediaInput(session, mediaData);
    await saveSession(from, session);
    return responseText;
  }

  // 4. State Machine Logic (Text)
  switch (session.step) {
    case 'LANGUAGE_SELECTION':
      const langIndex = parseInt(body) - 1;
      if (langIndex >= 0 && langIndex < LANGUAGES.length) {
        session.language = LANGUAGES[langIndex].split(' ')[0];
        session.step = 'SYMPTOM_COLLECTION';
        responseText = `Great! We will continue in *${session.language}*.\n\nHow can I help you today? Please describe your symptoms or ask a health question. (e.g., "I have a severe headache and fever")`;
      } else {
        responseText = "Invalid selection. Please reply with a number (1-8) to select your language.";
      }
      break;

    case 'SYMPTOM_COLLECTION':
      session.userData.symptoms = body;
      session.step = 'LOCATION_COLLECTION';
      responseText = "I've noted your symptoms. To find the best doctors and hospitals nearby, please tell me which *City* you are in?";
      break;

    case 'LOCATION_COLLECTION':
      session.userData.city = body;
      session.step = 'PROCESSING';
      responseText = await generateMedicalResponse(session);
      session.step = 'CHAT'; // Move to general chat
      break;

    case 'CHAT':
      responseText = await handleGeneralChat(session, body);
      break;

    default:
      session.step = 'LANGUAGE_SELECTION';
      responseText = "Let's restart our conversation to ensure I have the right context. Which language do you prefer?";
  }

  // 5. Persist updated state
  await saveSession(from, session);
  return responseText;
}

async function handleMediaInput(session, mediaData) {
  try {
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const response = await axios.get(mediaData.url, { 
      responseType: 'arraybuffer',
      headers: { 'Authorization': `Basic ${auth}` }
    });
    const buffer = Buffer.from(response.data, 'binary');
    const base64Data = buffer.toString('base64');

    const prompt = mediaData.type.startsWith('image') 
      ? `You are a medical assistant. Analyze this medical report/image and provide a summary in ${session.language}. Note: This is for informational purposes only.`
      : `Transcribe and summarize this medical voice note in ${session.language}.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: mediaData.type } }
    ]);

    return `📄 *Media Analysis* (${session.language}):\n\n${result.response.text()}\n\n_Disclaimer: This is AI-generated advice. Please consult a physical doctor for official diagnosis._`;
  } catch (error) {
    console.error("Media Processing Error:", error);
    return "I received your media but had trouble analyzing it. Please try sending a clear photo or text message instead.";
  }
}

async function generateMedicalResponse(session) {
  const prompt = `
    You are MediPath's Elite AI WhatsApp Agent. 
    User Language: ${session.language}
    Symptoms: ${session.userData.symptoms}
    City: ${session.userData.city}

    INSTRUCTIONS:
    1. Respond in ${session.language}.
    2. Provide a structured response with Analysis, Top Doctors & Hospitals in ${session.userData.city}, and Recovery advice.
    3. Use bold headers, bullet points, and emojis.
    4. Ask if they want to set a medicine reminder.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "I'm having trouble connecting to my medical database. Please try again in a moment.";
  }
}

async function handleGeneralChat(session, body) {
  const prompt = `
    You are MediPath's AI WhatsApp Assistant. 
    Language: ${session.language}
    User Location: ${session.userData.city}
    User Symptoms: ${session.userData.symptoms}
    
    Current Message: "${body}"
    
    If the user asks to set a reminder for a medicine, respond with: { "reminder": { "medicine": "...", "time": "HH:MM AM/PM" } }
    Otherwise, answer their health query.
  `;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    const reminderMatch = responseText.match(/\{ "reminder": \{ "medicine": "(.*?)", "time": "(.*?)" \} \}/);
    if (reminderMatch) {
      const medicine = reminderMatch[1];
      const time = reminderMatch[2];
      
      await addReminder({
        phone: session.from,
        medicine,
        time,
        sent: false,
        createdAt: new Date().toISOString()
      });

      responseText = `✅ *Reminder Set!*\n\nI will remind you to take *${medicine}* at *${time}*. Stay healthy!`;
    }

    return responseText;
  } catch (error) {
    return "I'm here to help, but I'm having a technical issue. What else can I do for you?";
  }
}
