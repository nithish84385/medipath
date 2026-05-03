import { DOCTORS_DB } from '../data/doctors';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Match doctors to patient symptoms using weighted specialty scoring.
 * Deterministic — no random values, same symptoms always produce same ranking.
 */
export async function matchDoctors(selectedSymptoms, symptomMap) {
  if (!selectedSymptoms.length) return [];

  // Build specialty scores from symptoms
  const specialtyScores = {};
  selectedSymptoms.forEach(symptom => {
    const specialties = symptomMap[symptom] || ['General Medicine'];
    specialties.forEach((sp, i) => {
      specialtyScores[sp] = (specialtyScores[sp] || 0) + (i === 0 ? 2 : 1);
    });
  });

  const topSpecialties = Object.entries(specialtyScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);

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

  const doctorsDB = [...DOCTORS_DB, ...firestoreDoctors];

  const matched = doctorsDB
    .filter(d => {
      const dSpec = (d.specialty || d.specialization || '').toLowerCase();
      if (!dSpec) return false;
      const dWords = dSpec.split(/[\s-]+/).filter(w => w.length > 2);
      return topSpecialties.some(ts => {
        const target = ts.toLowerCase();
        if (dSpec.includes(target) || target.includes(dSpec)) return true;
        const tWords = target.split(/[\s-]+/).filter(w => w.length > 2);
        return dWords.some(dw => tWords.some(tw => dw.includes(tw) || tw.includes(dw)));
      });
    })
    .map(d => {
      const dSpec = (d.specialty || d.specialization || '').toLowerCase();
      const dWords = dSpec.split(/[\s-]+/).filter(w => w.length > 2);

      const matchedTs = topSpecialties.find(ts => {
        const target = ts.toLowerCase();
        if (dSpec.includes(target) || target.includes(dSpec)) return true;
        const tWords = target.split(/[\s-]+/).filter(w => w.length > 2);
        return dWords.some(dw => tWords.some(tw => dw.includes(tw) || tw.includes(dw)));
      });

      const specialtyWeight = specialtyScores[matchedTs] || 0;
      const maxSpecialtyScore = Math.max(...Object.values(specialtyScores));
      const specialtyMatch = maxSpecialtyScore > 0 ? (specialtyWeight / maxSpecialtyScore) : 0.5;

      const expRaw = d.experience || d.yearsExperience || 0;
      const expNum = typeof expRaw === 'string' ? (parseInt(expRaw.replace(/\D/g, '')) || 0) : expRaw;
      const experienceScore = Math.min(expNum / 40, 1);

      const ratingRaw = d.rating || 4.5;
      const ratingNum = typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : ratingRaw;
      const ratingScore = Math.max(0, Math.min(((ratingNum || 4.0) - 3.0) / 2.0, 1));

      const isAvailable = d.available !== undefined ? d.available : true;
      const availabilityBonus = isAvailable ? 0.05 : 0;

      // Deterministic score — no Math.random()
      const rawScore = specialtyMatch * 0.55 + ratingScore * 0.25 + experienceScore * 0.15 + availabilityBonus;
      const score = isNaN(rawScore) ? 50 : Math.min(Math.round(rawScore * 100), 99);

      return {
        ...d,
        score,
        available: isAvailable,
        yearsExperience: expNum,
        consultationFee: parseInt(d.fee || d.consultationFee || 500),
        avatar: d.name ? d.name.split(' ').map(p => p[0]).join('').slice(0, 2) : 'DR',
        city: d.city || d.location || 'India',
        specialty: d.specialty || d.specialization || 'General',
      };
    })
    .sort((a, b) => b.score - a.score);

  return matched;
}
