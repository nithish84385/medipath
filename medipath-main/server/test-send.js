import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the parent root folder
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

if (!accountSid || !authToken) {
  console.error("Error: Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your .env file");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Replace with your actual WhatsApp number, including the country code (e.g., +919096030691)
const recipientNumber = process.argv[2]; 

if (!recipientNumber) {
  console.error("Please provide a destination number. Usage: node test-send.js +919096030691");
  process.exit(1);
}

async function sendTestMessage() {
  try {
    const message = await client.messages.create({
      body: 'Hello from Medipath! Your WhatsApp Agent backend is successfully connected. 🎉',
      from: `whatsapp:${twilioNumber}`,
      to: `whatsapp:${recipientNumber}`
    });

    console.log(`Message sent successfully! Message SID: ${message.sid}`);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

sendTestMessage();
