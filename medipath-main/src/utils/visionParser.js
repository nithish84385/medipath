import { genAI } from '../lib/gemini';

export async function parseMedicalImage(base64Image, mimeType) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert Medical OCR Agent.
      Analyze this medical document (prescription, lab report, etc).
      Extract the following information:
      - Primary Diagnosis (string)
      - Symptoms mentioned (string)
      - List of Medications (array of objects with name, dosage, instruction)

      If something is unreadable or not present, use "Unknown" or empty array.
      
      Output strictly in this JSON format:
      {
        "diagnosis": "...",
        "symptoms": "...",
        "medications": [
          { "name": "...", "dosage": "...", "instruction": "..." }
        ]
      }
    `;

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const textResult = result.response.text().trim();
    
    // Find the JSON block
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from vision response");
    
    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error("Vision OCR Error:", error);
    return null;
  }
}
