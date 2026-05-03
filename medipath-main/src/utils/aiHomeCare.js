import { genAI } from '../lib/gemini';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function generateHomeCarePlan(patientEmail, patientName, symptoms, customSymptom = "") {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    // Safety Constraint Model & Generation Prompt
    const prompt = `
      You are an expert AI Triage and Home-Care Agent for MediPath.
      
      Patient Symptoms: 
      - Selected: ${symptoms.join(', ')}
      - Custom: ${customSymptom}

      CONSTRAINT MODEL RULE 1: Think like a compassionate, highly capable doctor. You should strive to provide helpful Home-Care, Diet, and Over-The-Counter (OTC) recommendations for almost all general symptoms (fever, stomach ache, cough, flu, pain, fatigue, mild injuries). Do not be overly restrictive.
      CONSTRAINT MODEL RULE 2: ONLY refuse to generate a plan if the symptom is a glaring, immediate life-threatening emergency (e.g., severe heart attack symptoms, active stroke, or massive trauma).

      If REJECTED due to Rule 1:
      Respond ONLY with a JSON object containing {"status": "rejected", "reason": "brief explanation of why they need a real doctor immediately"}

      If ACCEPTED due to Rule 2:
      Respond ONLY with a JSON object outlining a home-care plan mimicking a prescription. Structure:
      {
        "status": "accepted",
        "diagnosis": "Likely condition (e.g. Common Viral Cold)",
        "diet": {
          "foods": "Chicken soup, toast",
          "avoid": "Spicy food, dairy",
          "notes": "Stay extremely hydrated."
        },
        "medications": [
          {
            "name": "Paracetamol 500mg (OTC)",
            "instruction": "After meals",
            "days": "3",
            "dosage": "1 tablet"
          }
        ]
      }
      Do NOT wrap the output in markdown code blocks like \`\`\`json. Return pure JSON.
    `;

    const result = await model.generateContent(prompt);
    let textResult = result.response.text().trim();
    
    // Robust JSON extraction
    const jsonMatch = textResult.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response.");
    }

    const plan = JSON.parse(jsonMatch[0]);

    if (plan.status === 'rejected') {
      return { success: false, reason: plan.reason };
    }

    // Prepare standard prescription object for Firestore
    const prescriptionData = {
      doctorId: "ai_agent",
      doctorName: "AI Home-Care Assistant",
      doctorSpecialty: "General Wellness",
      patientEmail,
      patientName,
      diagnosis: plan.diagnosis,
      symptoms: `${symptoms.join(', ')} ${customSymptom}`.trim(),
      queueEntryId: "autonomous_home_care",
      medications: plan.medications.map(med => ({
        name: med.name,
        dosage: med.dosage,
        days: parseInt(med.days, 10) || 1,
        instruction: med.instruction,
        times: ["09:00 AM", "09:00 PM"], // Default basic schedule
        taken: [false, false]
      })),
      diet: plan.diet,
      createdAt: new Date().toISOString(),
      status: 'active',
      isAiGenerated: true // Marker flag
    };

    const docRef = await addDoc(collection(db, 'prescriptions'), prescriptionData);
    
    return { success: true, prescriptionId: docRef.id };

  } catch (error) {
    console.error("AI Home Care Engine Error:", error);
    return { success: false, reason: "System Error: " + error.message };
  }
}
