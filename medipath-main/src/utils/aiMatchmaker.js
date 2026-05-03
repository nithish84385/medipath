import { genAI } from '../lib/gemini';
import { DOCTORS_DB } from '../data/doctors';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function aiMatchDoctors(selectedSymptoms, customSymptom = "", userCity = "") {
  if (!selectedSymptoms.length && !customSymptom.trim()) return [];

  // Fetch doctors from mock DB and Firebase
  let firestoreDoctors = [];
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
    const snap = await getDocs(q);
    firestoreDoctors = snap.docs.map(d => ({
      id: d.id,
      name: d.data().name || 'Unknown Doctor',
      specialty: d.data().specialty || 'General Medicine',
      experience: d.data().experience || 5,
      rating: d.data().rating || 4.0,
      fee: d.data().fee || 1000,
      available: true,
      city: d.data().city || 'Online',
    }));
  } catch (e) {
    console.error('Error fetching live doctors:', e);
  }

  // Combine and format doctors database for prompt
  const doctorsDB = [...DOCTORS_DB, ...firestoreDoctors].map(d => ({
    id: d.id,
    name: d.name,
    specialty: d.specialty || d.specialization || 'General Practitioner',
    yearsExperience: d.experience || d.yearsExperience || 0,
    rating: d.rating || 4.5,
    consultationFee: d.fee || d.consultationFee || 500,
    city: d.city || d.location || 'Unknown',
    available: d.available !== undefined ? d.available : true,
    avatar: d.name ? d.name.split(' ').map(p => p[0]).join('').slice(0, 2) : 'DR'
  }));

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    let baseDbSample = doctorsDB.slice(0, 10).map(d => ({name: d.name, specialty: d.specialty, city: d.city}));
    
    const prompt = `
      You are the elite MediPath AI Matchmaker Agent.
      A patient has reported the following symptoms:
      Symptoms: ${selectedSymptoms.join(', ')}
      Custom Notes: ${customSymptom}
      Patient's Location: ${userCity ? userCity : 'Unknown Location'}

      Your objective is to find or generate the 3 absolute best doctors for this patient.
      
      INSTRUCTIONS:
      1. Analyze the symptoms and determine the exact medical specialty required.
      2. If the "Patient's Location" is known, use your knowledge of the real world to identify 2 or 3 REAL, prominent, highly-rated hospitals situated in that specific city. 
      3. Generate 3 highly realistic, top-tier doctors. You can create simulated realistic names. They MUST be mapped to the real-world hospitals you identified in the patient's city.
      4. Give each doctor a match score (0-100) based on how perfectly they fit the symptoms.
      5. Write a brief, personalized "bio" (1-2 sentences) explaining why this doctor at this specific hospital is the perfect match for the patient's symptoms.
      6. Provide a "gender" field ("male" or "female") so we can generate a realistic avatar.

      Output strictly in JSON format as an array of objects:
      [
        {
          "id": "gen_unique_id",
          "name": "Dr. Firstname Lastname",
          "gender": "male or female",
          "specialty": "Determined Specialty",
          "hospital": "Name of Real Hospital in their City",
          "city": "Patient's City",
          "yearsExperience": 15,
          "rating": 4.9,
          "consultationFee": 1500,
          "score": 98,
          "bio": "Brief explanation of why they are the perfect match..."
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    let textResult = result.response.text().trim();
    
    const jsonMatch = textResult.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON array from AI.");
    }

    const generatedDoctors = JSON.parse(jsonMatch[0]);

    // Format the generated doctors with avatar URLs and fallbacks
    const matched = generatedDoctors.map((doc, idx) => {
      // Use public avatar API for realistic faces
      const avatarUrl = doc.gender === 'female' 
        ? `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(doc.name)}`
        : `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(doc.name)}`;

      return {
        ...doc,
        id: doc.id || `gen_${idx}_${Date.now()}`,
        photoUrl: avatarUrl,
        available: true,
        avatar: doc.name.split(' ').map(p => p[0]).join('').slice(0, 2)
      };
    }).sort((a, b) => b.score - a.score);

    if (matched.length === 0) {
      throw new Error("AI returned empty array, triggering local fallback.");
    }

    return matched;

  } catch (error) {
    console.warn("Gemini Match Error, falling back to local database algorithms", error);
    // Robust Fallback Algorithm
    const matchTerms = [...selectedSymptoms, customSymptom].join(' ').toLowerCase();
    
    const fallbackMatches = doctorsDB.map(doc => {
      let score = 50; // Base score
      
      // Match specialty
      if (matchTerms.includes(doc.specialty.toLowerCase())) score += 30;
      
      // Match city
      if (userCity && doc.city.toLowerCase() === userCity.toLowerCase()) score += 15;
      
      // Add random fuzziness (0-5)
      score += Math.floor(Math.random() * 5);
      
      return {
        ...doc,
        score: Math.min(score, 98), // Cap at 98
        bio: `${doc.name} is a highly rated ${doc.specialty} based in ${doc.city}.`,
        available: true,
      };
    });

    // Sort by score and take top 3
    return fallbackMatches.sort((a, b) => b.score - a.score).slice(0, 3);
  }
}
