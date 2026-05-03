import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, PlayCircle, TrendingUp, X, Sparkles, Utensils } from 'lucide-react';
import Navbar from '../../components/Navbar';
import SOSButton from '../../components/SOSButton';
import SOSModal from '../../components/SOSModal';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { getVideosForSpecialty, RECOVERY_VIDEOS } from '../../data/videos';
import { genAI } from '../../lib/gemini';

const DEFAULT_EXERCISES = [
  { time: '7:00 AM', activity: 'Morning Walk', duration: '20 mins', intensity: 'Low' },
  { time: '11:00 AM', activity: 'Light Stretching', duration: '10 mins', intensity: 'Low' },
  { time: '5:00 PM', activity: 'Breathing Exercises', duration: '15 mins', intensity: 'Low' },
];

export default function Recovery({ user, onLogout }) {
  const [showSOS, setShowSOS] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [videoFilter, setVideoFilter] = useState('All');
  const [prescription, setPrescription] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  // Exercise done state initialised as all false (not one hardcoded true)
  const [exerciseDone, setExerciseDone] = useState([false, false, false]);
  const [aiDietPlan, setAiDietPlan] = useState(null);
  const [generatingDiet, setGeneratingDiet] = useState(false);
  const navigate = useNavigate();

  const generateDietPlan = async () => {
    if (!prescription) return;
    setGeneratingDiet(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a Diet & Lifestyle Coach Agent. 
      The patient has been diagnosed with: ${prescription.diagnosis || 'Unknown condition'}
      Symptoms: ${prescription.symptoms || 'Unknown'}
      Medications: ${JSON.stringify(prescription.medications || [])}
      
      Generate a very concise, personalized 1-day diet plan and quick lifestyle tip ensuring it doesn't conflict with their meds.
      Format it as simple plain text with bullets (e.g., "- Breakfast: ..."). Do not use markdown bolding/asterisks.`;
      
      const result = await model.generateContent(prompt);
      setAiDietPlan(result.response.text());
      
      if (prescription.id) {
         await updateDoc(doc(db, 'prescriptions', prescription.id), { aiDietPlan: result.response.text() });
      }
    } catch(err) {
      console.error(err);
      setAiDietPlan("Sorry, I couldn't generate a diet plan right now.");
    } finally {
      setGeneratingDiet(false);
    }
  };

  // Proper scoped query
  useEffect(() => {
    const email = (user?.email || '').toLowerCase().trim();
    if (!email) { setLoadingPlan(false); return; }

    const q = query(
      collection(db, 'prescriptions'),
      where('patientEmail', '==', email),
      where('status', '==', 'active')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      const matched = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const latest = matched[0] || null;
      setPrescription(latest);
      // Restore exercise done state from Firestore
      if (latest?.exerciseDone) setExerciseDone(latest.exerciseDone);
      if (latest?.aiDietPlan) setAiDietPlan(latest.aiDietPlan);
      setLoadingPlan(false);
    });
    return () => unsubscribe();
  }, [user?.email]);

  // Toggle exercise and persist to Firestore
  const toggleExercise = async (i) => {
    const next = exerciseDone.map((d, di) => di === i ? !d : d);
    setExerciseDone(next);
    if (prescription?.id) {
      try {
        await updateDoc(doc(db, 'prescriptions', prescription.id), { exerciseDone: next });
      } catch (e) { console.error('Exercise state save error:', e); }
    }
  };

  const specialty = prescription?.doctorSpecialty || 'General Medicine';
  let videos = [];
  if (prescription?.recoveryVideos?.length) {
    videos = RECOVERY_VIDEOS.filter(v => prescription.recoveryVideos.includes(v.id));
  }
  if (videos.length === 0) videos = getVideosForSpecialty(specialty);
  if (videos.length < 4) videos = RECOVERY_VIDEOS;

  const categories = ['All', ...new Set(videos.map(v => v.category))];
  const filteredVideos = videoFilter === 'All' ? videos : videos.filter(v => v.category === videoFilter);
  const exerciseText = (prescription?.exercise || '').trim();

  const maxRecoveryDays = prescription?.medications?.length
    ? Math.max(...prescription.medications.map(m => parseInt(m.days, 10) || 1)) : 0;
  const currentRecoveryDay = Math.max(1, parseInt(prescription?.currentDay, 10) || 1);
  const completedDays = maxRecoveryDays > 0 ? Math.min(currentRecoveryDay - 1, maxRecoveryDays) : 0;
  const recoveryProgress = maxRecoveryDays > 0 ? Math.round((completedDays / maxRecoveryDays) * 100) : 0;
  const recoveryStatus = maxRecoveryDays > 0
    ? `Day ${Math.min(currentRecoveryDay, maxRecoveryDays)} of ${maxRecoveryDays} — keep going!`
    : 'Waiting for doctor treatment timeline.';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={0} onLogout={onLogout} />
      <div className="page-container">
        <div className="section-header fade-in">
          <h1>Recovery Plan</h1>
          <p>Your personalized health journey</p>
        </div>

        {/* AI Diet Coach */}
        <div className="med-card card-pad-lg mb-6 fade-in" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="card-head-left mb-5 flex justify-between items-center w-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <Utensils size={22} color="#8b5cf6" />
              </div>
              <h2 className="text-xl font-bold flex items-center gap-2">AI Diet & Lifestyle Coach <Sparkles size={16} color="#8b5cf6" /></h2>
            </div>
          </div>
          
          {!aiDietPlan ? (
            <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-sm text-purple-800 mb-4 font-medium">Generate a personalized nutrition plan based on your exact medications and diagnosis.</p>
              <button className="btn bg-[#8b5cf6] text-white hover:bg-purple-600 border-none shadow-md px-6 py-2 rounded-full font-bold" onClick={generateDietPlan} disabled={generatingDiet}>
                {generatingDiet ? 'Generating...' : '✨ Generate AI Diet Plan'}
              </button>
            </div>
          ) : (
            <div className="p-5 bg-purple-50/50 rounded-xl border border-purple-100">
              <div className="space-y-2 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {aiDietPlan}
              </div>
              <button className="mt-4 text-xs font-bold text-purple-600 underline" onClick={generateDietPlan} disabled={generatingDiet}>
                 {generatingDiet ? 'Regenerating...' : 'Regenerate Plan'}
              </button>
            </div>
          )}
        </div>

        {/* Exercise Plan */}
        <div className="med-card card-pad-lg mb-6 fade-in" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="card-head-left mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-light)' }}>
              <Dumbbell size={22} color="var(--primary)" />
            </div>
            <h2 className="text-xl font-bold">Exercise Plan</h2>
          </div>

          {exerciseText && (
            <div className="p-4 rounded-lg mb-4 text-sm" style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', lineHeight: 1.7 }}>
              {exerciseText}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {DEFAULT_EXERCISES.map((e, i) => (
              <div key={i}
                className="flex items-center gap-4 p-4 rounded-xl"
                onClick={() => toggleExercise(i)}
                style={{
                  background: exerciseDone[i] ? 'var(--success-light)' : 'white',
                  border: `2px solid ${exerciseDone[i] ? 'var(--success)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: exerciseDone[i] ? 'var(--success)' : 'var(--text-muted)', opacity: exerciseDone[i] ? 1 : 0.4 }} />
                <div className="flex-1">
                  <div className="font-bold mb-1" style={{ color: exerciseDone[i] ? 'var(--success)' : 'var(--text-primary)',  textDecoration: exerciseDone[i] ? 'line-through' : 'none' }}>
                    {e.activity}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{e.time} | {e.duration}</div>
                </div>
                <span className="badge badge-primary">{e.intensity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery Progress */}
        <div className="med-card fade-in text-center mb-6"
          style={{ background: 'linear-gradient(135deg, var(--success-light) 0%, rgba(40,167,69,0.05) 100%)', border: '2px solid rgba(40,167,69,0.2)', padding: '32px' }}>
          <TrendingUp size={32} color="var(--success)" className="mx-auto mb-3" />
          <div className="text-6xl font-black mb-2" style={{ color: 'var(--success)' }}>
            {loadingPlan ? '...' : `${recoveryProgress}%`}
          </div>
          <div className="font-bold text-lg mb-1">Recovery Progress</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {loadingPlan ? 'Calculating...' : recoveryStatus}
          </div>
        </div>

        {/* Video Library */}
        <div className="med-card card-pad-lg mb-6 fade-in" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="card-head mb-5">
            <div className="card-head-left">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,193,7,0.1)' }}>
                <PlayCircle size={22} color="var(--warning)" />
              </div>
              <h2 className="text-xl font-bold">Video Library</h2>
            </div>
            <span className="badge badge-neutral">{filteredVideos.length} videos</span>
          </div>
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button key={cat} className="btn btn-sm" onClick={() => setVideoFilter(cat)}
                style={{
                  background: videoFilter === cat ? 'var(--warning)' : 'transparent',
                  color: videoFilter === cat ? 'white' : 'var(--text-secondary)',
                  border: `2px solid ${videoFilter === cat ? 'var(--warning)' : 'var(--border)'}`,
                  whiteSpace: 'nowrap',
                }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {filteredVideos.map(v => (
              <div key={v.id} className="video-card">
                {activeVideoId === v.id ? (
                  <div style={{ position: 'relative' }}>
                    <iframe width="100%" style={{ aspectRatio: '16/9', border: 'none', borderRadius: '12px 12px 0 0' }}
                      src={`https://www.youtube.com/embed/${v.youtubeId}?autoplay=1`} title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    <button className="btn btn-sm" onClick={() => setActiveVideoId(null)}
                      style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.8)', color: 'white', borderRadius: '50%', padding: '6px' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="video-thumb" onClick={() => setActiveVideoId(v.id)}>
                    <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button className="video-play-btn"><PlayCircle size={32} /></button>
                    <span className="badge" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '4px 10px' }}>{v.duration}</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="font-bold text-sm mb-2">{v.title}</div>
                  <div className="text-xs mb-3" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{v.description}</div>
                  <div className="flex gap-2">
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{v.category}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{v.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-full fade-in" onClick={() => navigate('/patient/match')}>
          Book New Appointment
        </button>
      </div>

      <SOSButton onPress={() => setShowSOS(true)} />
      {showSOS && <SOSModal user={user} prescriptionData={prescription} onClose={() => setShowSOS(false)} />}
    </div>
  );
}
