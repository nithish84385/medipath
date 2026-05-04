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
      isRegistered: true,
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
    
    const prompt = `
      You are an elite medical triage AI.
      Patient Symptoms: ${selectedSymptoms.join(', ')}
      Custom Notes: ${customSymptom}
      
      Determine the single most relevant medical specialty required.
      Choose from: Cardiology, Neurology, Orthopedics, Pulmonology, Gastroenterology, Dermatology, ENT, Endocrinology, Internal Medicine, General Medicine, Rheumatology, General Surgery, Infectious Disease, Ophthalmology, Psychiatry, Oncology, Pediatrics, Gynecology.

      Output strictly as JSON:
      {
        "specialty": "Determined Specialty"
      }
    `;

    let targetSpecialty = "General Medicine";
    try {
      const result = await model.generateContent(prompt);
      const textResult = result.response.text().trim();
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        targetSpecialty = JSON.parse(jsonMatch[0]).specialty;
      }
    } catch (aiErr) {
      console.warn("AI Specialty check failed, using keyword fallback", aiErr);
    }

    const matchTerms = [...selectedSymptoms, customSymptom].join(' ').toLowerCase();

    // Deterministic Smart Scoring Algorithm
    const scoredDoctors = doctorsDB.map((doc, idx) => {
      let score = 0;
      
      // 1. Specialty Match
      const docSpec = (doc.specialty || '').toLowerCase();
      if (docSpec === targetSpecialty.toLowerCase() || matchTerms.includes(docSpec)) {
         score += 1000;
      }

      // 2. Strict Location Enforcement
      const docCity = (doc.city || '').toLowerCase();
      const uCity = (userCity || '').toLowerCase();
      const cityMatch = uCity && docCity === uCity;
      
      let finalCity = doc.city || 'Online';
      let finalHospital = doc.hospital || 'MediPath Partner Clinic';

      if (cityMatch) {
         score += 500;
      } else if (uCity && docCity !== 'online') {
         // If they are from a different city, we strictly overwrite them to be a generic local doctor
         // This prevents the user from seeing "Dhaka" when they search from "London"
         finalCity = userCity;
         finalHospital = `${userCity} Medical Center`;
         score -= 100; // Real locals still rank higher
      } else if (uCity && docCity === 'online') {
         finalCity = userCity; // Map online doctors to the local city
      }

      // 3. GUARANTEED REGISTERED DOCTORS ON TOP
      if (doc.isRegistered) {
         score += 50000; // Massive boost guarantees they are #1
         finalCity = userCity || doc.city || 'Online'; // Force them to match the search city
      }

      // 4. Rating Bonus
      score += (doc.rating || 4.0) * 10;

      // Calculate a realistic percentage for the UI (cap at 99%)
      const matchPercentage = doc.isRegistered ? 99 : Math.min(Math.max(Math.floor((score / 1500) * 100), 40), 98);

      // Generate Avatar
      const avatarUrl = `https://avatar.iran.liara.run/public/${idx % 2 === 0 ? 'boy' : 'girl'}?username=${encodeURIComponent(doc.name)}`;

      return {
        ...doc,
        id: doc.id || `doc_${idx}`,
        photoUrl: avatarUrl,
        score: matchPercentage,
        sortScore: score, // Use raw score for sorting
        city: finalCity,
        bio: doc.isRegistered ? `✨ Verified MediPath Specialist.` : `Highly rated specialist based in ${finalCity}.`,
        contact: doc.contact || `+91-${Math.floor(Math.random() * 900000000 + 1000000000)}`,
        hospital: finalHospital
      };
    });

    // Sort strictly by our calculated score and return top 6
    const topMatches = scoredDoctors.sort((a, b) => b.sortScore - a.sortScore).slice(0, 6);
    
    if (topMatches.length === 0) throw new Error("No doctors matched");
    
    return topMatches;

  } catch (error) {
    console.error("Critical Match Error", error);
    return [];
  }
}
