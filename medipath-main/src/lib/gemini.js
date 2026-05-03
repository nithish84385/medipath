import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("VITE_GEMINI_API_KEY is missing from .env file!");
}

const genAI = new GoogleGenerativeAI(apiKey || 'unauthorized');

export { genAI };
