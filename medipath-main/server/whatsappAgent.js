import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { getSession, saveSession, addReminder } from './localDb.js';

let model = null;
function getModel() {
  if (!model) {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }
  return model;
}

const LANGUAGES = [
  "English", "Hindi (हिंदी)", "Telugu (తెలుగు)", "Tamil (தமிழ்)", 
  "Bengali (বাংলা)", "Marathi (मराठी)", "Kannada (ಕನ್ನಡ)", "Malayalam (മലയാളം)"
];

const TRANSLATIONS = {
  English: {
    symptoms_prompt: "✅ Great! We will continue in *English*.\n\nHow can I help you today? Please describe your symptoms or ask a health question.\n\n_Example: \"I have a severe headache and fever\"_",
    city_prompt: "I've noted your symptoms. To find the best doctors and hospitals nearby, please tell me which *City* you are in?"
  },
  Hindi: {
    symptoms_prompt: "✅ बहुत बढ़िया! हम *हिंदी* में जारी रखेंगे।\n\nमैं आज आपकी कैसे मदद कर सकता हूँ? कृपया अपने लक्षण बताएं या स्वास्थ्य संबंधी प्रश्न पूछें।\n\n_उदाहरण: \"मुझे तेज सिरदर्द और बुखार है\"_",
    city_prompt: "मैंने आपके लक्षण नोट कर लिए हैं। आस-पास के सबसे अच्छे डॉक्टरों और अस्पतालों को खोजने के लिए, कृपया मुझे बताएं कि आप किस *शहर* में हैं?"
  },
  Telugu: {
    symptoms_prompt: "✅ బాగుంది! మనం *తెలుగు*లో కొనసాగుతాము.\n\nఈ రోజు నేను మీకు ఎలా సహాయపడగలను? దయచేసి మీ లక్షణాలను వివరించండి లేదా ఆరోగ్య సంబంధిత ప్రశ్న అడగండి.\n\n_ఉదాహరణ: \"నాకు తీవ్రమైన తలనొప్పి మరియు జ్వరం ఉంది\"_",
    city_prompt: "నేను మీ లక్షణాలను గమనించాను. సమీపంలోని ఉత్తమ వైద్యులను మరియు ఆసుపత్రులను కనుగొనడానికి, దయచేసి మీరు ఏ *నగరంలో* ఉన్నారో నాకు చెప్పగలరా?"
  },
  Tamil: {
    symptoms_prompt: "✅ சிறப்பு! நாம் *தமிழில்* தொடர்வோம்.\n\nஇன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்? தயவுசெய்து உங்கள் அறிகுறிகளை விவரிக்கவும் அல்லது சுகாதார கேள்வியைக் கேட்கவும்.\n\n_உதாரணம்: \"எனக்கு கடுமையான தலைவலி மற்றும் காய்ச்சல் உள்ளது\"_",
    city_prompt: "உங்கள் அறிகுறிகளை நான் குறித்துக்கொண்டேன். அருகிலுள்ள சிறந்த மருத்துவர்கள் மற்றும் மருத்துவமனைகளைக் கண்டறிய, நீங்கள் எந்த *நகரத்தில்* இருக்கிறீர்கள் என்று தயவுசெய்து கூற முடியுமா?"
  },
  Bengali: {
    symptoms_prompt: "✅ দারুণ! আমরা *বাংলায়* চালিয়ে যাব।\n\nআজ আমি আপনাকে কীভাবে সাহায্য করতে পারি? অনুগ্রহ করে আপনার উপসর্গগুলি বর্ণনা করুন বা একটি স্বাস্থ্য সম্পর্কিত প্রশ্ন জিজ্ঞাসা করুন।\n\n_উদাহরণ: \"আমার প্রচণ্ড মাথাব্যথা এবং জ্বর আছে\"_",
    city_prompt: "আমি আপনার উপসর্গগুলি নোট করেছি। কাছাকাছি সেরা ডাক্তার এবং হাসপাতালগুলি খুঁজে পেতে, অনুগ্রহ করে আমাকে বলুন আপনি কোন *শহরে* আছেন?"
  },
  Marathi: {
    symptoms_prompt: "✅ उत्तम! आपण *मराठीत* पुढे जाऊ.\n\nआज मी तुम्हाला कशी मदत करू शकतो? कृपया तुमची लक्षणे सांगा किंवा आरोग्यासंबंधी प्रश्न विचारा.\n\n_उदाहरण: \"मला तीव्र डोकेदुखी आणि ताप आहे\"_",
    city_prompt: "मी तुमची लक्षणे नोंदवली आहेत. जवळचे सर्वोत्तम डॉक्टर आणि रुग्णालये शोधण्यासाठी, कृपया मला सांगा तुम्ही कोणत्या *शहरात* आहात?"
  },
  Kannada: {
    symptoms_prompt: "✅ ಉತ್ತಮ! ನಾವು *ಕನ್ನಡದಲ್ಲಿ* ಮುಂದುವರಿಯುತ್ತೇವೆ.\n\nಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ದಯವಿಟ್ಟು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ ಅಥವಾ ಆರೋಗ್ಯದ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.\n\n_ಉದಾಹರಣೆ: \"ನನಗೆ ತೀವ್ರ ತಲೆನೋವು ಮತ್ತು ಜ್ವರವಿದೆ\"_",
    city_prompt: "ನಾನು ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಗಮನಿಸಿದ್ದೇನೆ. ಹತ್ತಿರದ ಅತ್ಯುತ್ತಮ ವೈದ್ಯರು ಮತ್ತು ಆಸ್ಪತ್ರೆಗಳನ್ನು ಹುಡುಕಲು, ದಯವಿಟ್ಟು ನೀವು ಯಾವ *ನಗರದಲ್ಲಿ* ಇದ್ದೀರಿ ಎಂದು ನನಗೆ ಹೇಳಬಲ್ಲಿರಾ?"
  },
  Malayalam: {
    symptoms_prompt: "✅ കൊള്ളാം! നമുക്ക് *മലയാളത്തിൽ* തുടരാം.\n\nഇന്ന് നിങ്ങളെ സഹായിക്കാൻ എനിക്ക് എങ്ങനെ കഴിയും? ദയവായി നിങ്ങളുടെ രോഗലക്ഷണങ്ങൾ വിശദീകരിക്കുക അല്ലെങ്കിൽ ഒരു ആരോഗ്യ ചോദ്യം ചോദിക്കുക.\n\n_ഉദാഹരണം: \"എനിക്ക് കഠിനമായ തലവേദനയും പനിയും ഉണ്ട്\"_",
    city_prompt: "നിങ്ങളുടെ രോഗലക്ഷണങ്ങൾ ഞാൻ കുറിച്ചെടുത്തു. അടുത്തുള്ള മികച്ച ഡോക്ടർമാരെയും ആശുപത്രികളെയും കണ്ടെത്താൻ, നിങ്ങൾ ഏത് *നഗരത്തിലാണ്* ഉള്ളതെന്ന് ദയവായി പറയാമോ?"
  }
};

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

  // Handle reset command at any stage
  const lowerBody = (body || '').toLowerCase().trim();
  if (['reset', 'restart', 'start over', 'menu'].includes(lowerBody)) {
    session.step = 'LANGUAGE_SELECTION';
    session.language = 'English';
    session.userData = {};
    await saveSession(from, session);
    return `🔄 Restarting...\n\n` +
           `Welcome to *MediPath AI*! 🏥 Your personalized health assistant.\n\n` +
           `Please select your preferred language:\n\n` +
           LANGUAGES.map((l, i) => `${i + 1}. ${l}`).join('\n');
  }

  // Auto-SOS Detection
  const EMERGENCY_KEYWORDS = ['chest pain', 'heart attack', 'bleeding heavily', 'can\'t breathe', 'suicide', 'kill myself', 'stroke', 'fainting', 'unconscious', 'emergency'];
  if (EMERGENCY_KEYWORDS.some(kw => lowerBody.includes(kw))) {
    return `🚨 *EMERGENCY DETECTED* 🚨\n\nBased on your message, you may be experiencing a medical emergency.\n\n*Please seek immediate medical help or call emergency services (e.g., 112 or 911).* \n\nDo not wait for an online consultation.`;
  }

  // 3. Handle Media if present
  if (mediaData) {
    responseText = await handleMediaInput(session, mediaData);
    await saveSession(from, session);
    return responseText;
  }

  // 4. State Machine Logic (Text)
  switch (session.step) {
    case 'LANGUAGE_SELECTION': {
      const langIndex = parseInt(body) - 1;
      if (langIndex >= 0 && langIndex < LANGUAGES.length) {
        session.language = LANGUAGES[langIndex].split(' ')[0];
        session.step = 'SYMPTOM_COLLECTION';
        const t = TRANSLATIONS[session.language] || TRANSLATIONS.English;
        responseText = t.symptoms_prompt;
      } else {
        // Show menu again for any non-number input (like "hi", "hello")
        responseText = `Welcome to *MediPath AI*! 🏥\n\nPlease reply with a *number* to select your language:\n\n` +
                       LANGUAGES.map((l, i) => `${i + 1}. ${l}`).join('\n') +
                       `\n\n_Type a number from 1-8_`;
      }
      break;
    }

    case 'SYMPTOM_COLLECTION': {
      session.userData.symptoms = body;
      session.step = 'LOCATION_COLLECTION';
      const t = TRANSLATIONS[session.language] || TRANSLATIONS.English;
      responseText = t.city_prompt;
      break;
    }

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

    const result = await getModel().generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: mediaData.type } }
    ]);

    const textResult = result.response.text();
    session.userData.healthHistory = (session.userData.healthHistory || '') + '\n- ' + textResult;
    
    return `📄 *Media Analysis* (${session.language}):\n\n${textResult}\n\n_Disclaimer: This is AI-generated advice. Please consult a physical doctor for official diagnosis._`;
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
    Past Context/Reports: ${session.userData.healthHistory || 'None'}

    INSTRUCTIONS:
    1. Respond strictly in ${session.language}.
    2. Provide a highly structured response containing these exact sections:
       - *Diagnosis/Triage*: What might be wrong.
       - *Top Doctors & Hospitals*: Recommend 2-3 specific specialties or hospitals in ${session.userData.city}.
       - *Diet Plan*: A quick 3-bullet customized diet plan to recover faster.
       - *Home Care*: Immediate steps they can take at home.
    3. Use bold headers, bullet points, and emojis.
    4. End by asking if they want to set a medicine reminder.
  `;

  try {
    const result = await getModel().generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error in generateMedicalResponse:", error);
    return "I'm having trouble connecting to my medical database. Please try again in a moment.";
  }
}

async function handleGeneralChat(session, body) {
  const prompt = `
    You are MediPath's AI WhatsApp Assistant. 
    Language: ${session.language}
    User Location: ${session.userData.city}
    User Symptoms: ${session.userData.symptoms}
    Past Context/Reports: ${session.userData.healthHistory || 'None'}
    
    Current Message: "${body}"
    
    If the user asks to set a reminder for a medicine, respond with: { "reminder": { "medicine": "...", "time": "HH:MM AM/PM" } }
    Otherwise, answer their health query.
  `;

  try {
    const result = await getModel().generateContent(prompt);
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
    console.error("Gemini API Error in handleGeneralChat:", error);
    return "I'm here to help, but I'm having a technical issue. What else can I do for you?";
  }
}
