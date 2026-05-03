import { handleWhatsAppMessage } from './whatsappAgent.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function runSimulations() {
  const from = 'whatsapp:+9999999999';
  console.log("=== STARTING 10 SIMULATIONS ===\n");

  // 1. Reset Flow
  console.log("TEST 1: Reset Flow");
  console.log("User: reset");
  let response = await handleWhatsAppMessage(from, 'reset');
  console.log("Bot:", response, "\n");

  // 2. Standard Flow & Invalid Inputs
  console.log("TEST 2: Invalid Language Input");
  console.log("User: hello");
  response = await handleWhatsAppMessage(from, 'hello');
  console.log("Bot:", response, "\n");

  console.log("TEST 3: Valid Language Selection (English)");
  console.log("User: 1");
  response = await handleWhatsAppMessage(from, '1');
  console.log("Bot:", response, "\n");

  console.log("TEST 4: Emergency SOS Detection");
  console.log("User: I have severe chest pain and can't breathe");
  response = await handleWhatsAppMessage(from, 'I have severe chest pain and can\'t breathe');
  console.log("Bot:", response, "\n");

  console.log("TEST 5: Standard Flow (Symptoms -> City -> Response)");
  console.log("User: I have a light fever and mild headache");
  response = await handleWhatsAppMessage(from, 'I have a light fever and mild headache');
  console.log("Bot:", response, "\n");

  console.log("User: Mumbai");
  response = await handleWhatsAppMessage(from, 'Mumbai');
  console.log("Bot:", response, "\n");

  console.log("TEST 6: Follow-up Chat Context");
  console.log("User: Is it okay if I drink cold water?");
  response = await handleWhatsAppMessage(from, 'Is it okay if I drink cold water?');
  console.log("Bot:", response, "\n");

  console.log("TEST 7: Reminders");
  console.log("User: Remind me to take paracetamol at 9 PM");
  response = await handleWhatsAppMessage(from, 'Remind me to take paracetamol at 9 PM');
  console.log("Bot:", response, "\n");

  // 8. Localization Flow
  console.log("TEST 8: Localization Flow (Telugu)");
  await handleWhatsAppMessage(from, 'reset');
  console.log("User: 3"); // Telugu
  response = await handleWhatsAppMessage(from, '3');
  console.log("Bot:", response, "\n");

  console.log("User: నాకు జ్వరం ఉంది (I have fever)");
  response = await handleWhatsAppMessage(from, 'నాకు జ్వరం ఉంది');
  console.log("Bot:", response, "\n");

  console.log("User: Hyderabad");
  response = await handleWhatsAppMessage(from, 'Hyderabad');
  console.log("Bot:", response, "\n");

  console.log("=== SIMULATIONS COMPLETE ===");
}

runSimulations().catch(console.error);
