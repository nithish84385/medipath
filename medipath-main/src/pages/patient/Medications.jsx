import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Clock, CheckCircle2, Bell, MessageCircle, ArrowRight, Activity, Loader2, History, UtensilsCrossed, Sparkles } from 'lucide-react';
import Navbar from '../../components/Navbar';
import SOSButton from '../../components/SOSButton';
import SOSModal from '../../components/SOSModal';
import ChatPanel from '../../components/ChatPanel';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { genAI } from '../../lib/gemini';

export default function Medications({ user, onLogout }) {
  const [showSOS, setShowSOS] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notifiedSet = useRef(new Set());
  const [aiFeedback, setAiFeedback] = useState(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  // Proper scoped query — no full collection scan
  useEffect(() => {
    const email = (user?.email || '').toLowerCase().trim();
    if (!email) { setLoading(false); return; }

    const q = query(
      collection(db, 'prescriptions'),
      where('patientEmail', '==', email),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const active = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 1)
        .map(presc => ({
          ...presc,
          medications: (presc.medications || []).filter(med => !/^demo\b/i.test((med.name || '').trim())),
        }));
      setPrescriptions(active);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.email]);

  // Medication reminders via browser Notification API
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const interval = setInterval(() => {
      if ('Notification' in window && Notification.permission === 'granted' && prescriptions.length > 0) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const today = now.toDateString();
        prescriptions.forEach(p => {
          p.medications.forEach((med, mi) => {
            if (med.times && med.taken) {
              med.times.forEach((time, ti) => {
                const key = `${p.id}-${mi}-${ti}-${today}`;
                if (time === currentTime && !med.taken[ti] && !notifiedSet.current.has(key)) {
                  notifiedSet.current.add(key);
                  new Notification('MediPath: Time for your medicine', {
                    body: `Take ${med.dosage} of ${med.name} (${med.instruction}).`,
                  });
                }
              });
            }
          });
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [prescriptions]);

  const markTaken = async (prescriptionId, medIndex, timeIndex) => {
    const presc = prescriptions.find(p => p.id === prescriptionId);
    if (!presc) return;
    const updatedMeds = presc.medications.map((m, i) =>
      i === medIndex ? { ...m, taken: m.taken.map((t, ti) => ti === timeIndex ? true : t) } : m
    );
    
    // Optimistic UI Update
    setPrescriptions(prev => prev.map(p => 
      p.id === prescriptionId ? { ...p, medications: updatedMeds } : p
    ));

    try {
      await updateDoc(doc(db, 'prescriptions', prescriptionId), { medications: updatedMeds });
    } catch (err) { console.error('Error marking dose:', err); }
  };

  const advanceDay = async (prescriptionId) => {
    const presc = prescriptions.find(p => p.id === prescriptionId);
    if (!presc) return;
    const nextDay = (presc.currentDay || 1) + 1;
    const maxDays = presc.medications.length ? Math.max(...presc.medications.map(m => parseInt(m.days) || 1)) : 1;
    const updatedMeds = presc.medications.map(m => ({
      ...m,
      taken: (nextDay <= maxDays && m.times) ? m.times.map(() => false) : m.taken,
    }));
    try {
      await updateDoc(doc(db, 'prescriptions', prescriptionId), { currentDay: nextDay, medications: updatedMeds });
    } catch (err) { console.error('Error advancing day:', err); }
  };

  const archiveCourse = async (prescriptionId) => {
    try {
      await updateDoc(doc(db, 'prescriptions', prescriptionId), { status: 'archived' });
    } catch (err) { console.error('Error archiving:', err); }
  };

  const allCoursesFinished = prescriptions.length > 0 && prescriptions.every(presc => {
    const maxDays = presc.medications.length ? Math.max(...presc.medications.map(m => parseInt(m.days) || 1)) : 1;
    return (presc.currentDay || 1) > maxDays;
  });

  const todaysDoseStates = prescriptions.flatMap(presc => {
    const currentDay = presc.currentDay || 1;
    return (presc.medications || []).flatMap(med => {
      const isActiveToday = currentDay <= (parseInt(med.days) || 1);
      if (!isActiveToday || !med.times?.length) return [];
      return med.times.map((_, ti) => Boolean(med.taken?.[ti]));
    });
  });

  const totalDoses = todaysDoseStates.length;
  const takenDoses = todaysDoseStates.filter(Boolean).length;
  const compliance = totalDoses > 0 ? Math.round(takenDoses / totalDoses * 100) : 0;
  const activePresc = prescriptions[0];
  const chatId = activePresc?.queueEntryId || activePresc?.id;
  
  // Gamification Streak
  const currentStreak = activePresc ? Math.max(0, (activePresc.currentDay || 1) - 1) : 0;

  const splitItems = (value) => (value || '').split(/\r?\n|,/).map(s => s.trim()).filter(Boolean);
  const recommendedFoods = splitItems(activePresc?.diet?.foods);
  const avoidFoods = splitItems(activePresc?.diet?.avoid);
  const dietNotes = (activePresc?.diet?.notes || '').trim();

  const getAiFeedback = async () => {
    if (!activePresc) return;
    setGeneratingFeedback(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a Patient Success Agent. The patient has ${compliance}% compliance today on their medication for ${activePresc.diagnosis}. 
      Write a short, encouraging 2-sentence message to motivate them. If compliance is low, gently remind them of the importance of the meds. If high, praise them!`;
      const result = await model.generateContent(prompt);
      setAiFeedback(result.response.text());
    } catch(err) {
      console.error(err);
    } finally {
      setGeneratingFeedback(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={0} onLogout={onLogout} />
      <div className="page-container">
        {/* Header */}
        <div className="mb-8 fade-in">
          <div className="card-head" style={{ marginBottom: '12px' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <h1>Your Medications</h1>
              <p>{activePresc ? `Prescribed by Dr. ${activePresc.doctorName}` : 'Your active prescriptions'}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {chatId && (
                <button className="btn btn-outline btn-sm" onClick={() => setChatOpen(o => !o)}>
                  <MessageCircle size={14} /> Chat with Doctor
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/patient/history')}>
                <History size={14} /> Health History
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/patient/match')}>
                Book New Appointment
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <span className="ml-3" style={{ color: 'var(--text-muted)' }}>Loading prescriptions...</span>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="med-card card-center-lg fade-in text-center">
            <Pill size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <h3 className="font-bold mb-2">No Active Prescriptions</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              No treatments found for <strong>{user?.email?.toLowerCase()}</strong>.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/patient/match')}>
              Find a Doctor
            </button>
          </div>
        ) : (
          <>
            {/* Compliance Card */}
            <div className="med-card mb-6 fade-in" style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, rgba(0,102,204,0.05) 100%)', border: '2px solid rgba(0,102,204,0.15)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={20} color="var(--primary)" />
                  <h3 className="font-bold">Today's Progress</h3>
                </div>
                <div className="flex items-center gap-3">
                  {currentStreak > 0 && (
                    <span className="badge" style={{ background: '#FFEDD5', color: '#EA580C', fontWeight: 800 }}>
                      🔥 {currentStreak} Day Streak
                    </span>
                  )}
                  <span className="text-2xl font-black" style={{ color: compliance >= 60 ? 'var(--success)' : 'var(--warning)' }}>
                    {compliance}%
                  </span>
                </div>
              </div>
              <div className="compliance-bar-track">
                <div className="compliance-bar-fill" style={{ width: `${compliance}%` }}></div>
              </div>
              <div className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                {takenDoses} of {totalDoses} doses taken
              </div>

              <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,102,204,0.1)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                    <Sparkles size={14} /> AI Success Coach
                  </span>
                  {!aiFeedback && (
                    <button onClick={getAiFeedback} disabled={generatingFeedback} className="text-xs font-bold text-blue-600 underline">
                      {generatingFeedback ? 'Thinking...' : 'Get Feedback'}
                    </button>
                  )}
                </div>
                {aiFeedback && <p className="text-sm text-gray-700 italic">"{aiFeedback}"</p>}
              </div>

            </div>

            {/* Diet Plan */}
            {(recommendedFoods.length > 0 || avoidFoods.length > 0 || dietNotes) && (
              <div className="med-card mb-6 fade-in" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="card-head-left mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--success-light)' }}>
                    <UtensilsCrossed size={18} color="var(--success)" />
                  </div>
                  <h3 className="font-bold">Diet Plan</h3>
                </div>
                <div className="grid-2 mb-4">
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--success)', textTransform: 'uppercase' }}>Recommended Foods</div>
                    {recommendedFoods.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {recommendedFoods.map((food, i) => (
                          <div key={i} className="text-sm p-2 rounded-lg" style={{ background: 'var(--bg-section)' }}>{food}</div>
                        ))}
                      </div>
                    ) : <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No recommendations yet.</div>}
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--danger)', textTransform: 'uppercase' }}>Avoid</div>
                    {avoidFoods.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {avoidFoods.map((food, i) => (
                          <div key={i} className="text-sm p-2 rounded-lg" style={{ background: 'var(--bg-section)' }}>{food}</div>
                        ))}
                      </div>
                    ) : <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No avoid-list yet.</div>}
                  </div>
                </div>
                {dietNotes && (
                  <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                    {dietNotes}
                  </div>
                )}
              </div>
            )}

            {/* Prescription Cards */}
            {prescriptions.map(presc => {
              const currentDay = presc.currentDay || 1;
              const maxDays = presc.medications.length ? Math.max(...presc.medications.map(m => parseInt(m.days) || 1)) : 1;
              const isFinished = currentDay > maxDays;
              const allTakenToday = !isFinished && presc.medications.every(m => !m.times?.length || m.taken?.every(t => t));

              return (
                <div key={presc.id} className="mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-primary">Dr. {presc.doctorName}</span>
                      <span className="badge badge-neutral">{presc.diagnosis}</span>
                    </div>
                    {isFinished ? (
                      <span className="badge" style={{ background: 'var(--success-light)', color: 'var(--success)', fontWeight: 'bold' }}>✓ Course Complete</span>
                    ) : (
                      <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 'bold' }}>Day {currentDay} of {maxDays}</span>
                    )}
                  </div>

                  <div className={`flex flex-col gap-5 mb-4 ${isFinished ? 'opacity-60' : ''}`}>
                    {presc.medications.map((med, mi) => (
                      <div key={mi} className="med-card card-pad-md fade-in" style={{ animationDelay: `${mi * 0.1}s` }}>
                        <div className="flex items-start gap-4 mb-5">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
                            <Pill size={22} color="var(--primary)" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-lg mb-1">{med.name}</div>
                            <div className="meta-wrap">
                              <span className="badge badge-primary">{med.instruction}</span>
                              <span className="badge badge-neutral">{med.days} days</span>
                              {med.dosage && <span className="badge badge-neutral">{med.dosage}</span>}
                            </div>
                          </div>
                        </div>
                        {med.times?.length > 0 ? (
                          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                            {med.times.map((time, ti) => (
                              <div key={ti}
                                className={`med-time-slot ${med.taken?.[ti] ? 'taken' : ''}`}
                                onClick={() => !med.taken?.[ti] && markTaken(presc.id, mi, ti)}
                                style={{ padding: '16px', cursor: med.taken?.[ti] ? 'default' : 'pointer' }}>
                                <div className="text-2xl mb-2">
                                  {med.taken?.[ti] ? <CheckCircle2 size={28} color="var(--success)" /> : <Clock size={28} color="var(--text-muted)" />}
                                </div>
                                <div className="font-bold mb-1" style={{ color: med.taken?.[ti] ? 'var(--success)' : 'var(--text-primary)', fontSize: '1rem' }}>{time}</div>
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{med.taken?.[ti] ? 'Completed ✓' : 'Tap to mark'}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--bg-section)', color: 'var(--text-muted)' }}>
                            ⏳ Timings not yet set by your doctor
                          </div>
                        )}
                      </div>
                    ))}
                    {!isFinished && allTakenToday && (
                      <button className="btn btn-primary btn-full fade-in" onClick={() => advanceDay(presc.id)} style={{ fontWeight: 'bold' }}>
                        Complete Day {currentDay} & Advance to Day {currentDay + 1} <ArrowRight size={18} />
                      </button>
                    )}
                    {isFinished && (
                      <div className="flex flex-col gap-3 fade-in">
                        <div className="p-4 rounded-xl text-center" style={{ border: '2px solid rgba(40,167,69,0.2)', color: 'var(--success)', fontWeight: 'bold' }}>
                          Great job! You've completed the {maxDays}-day course.
                        </div>
                        <button className="btn btn-outline btn-full" onClick={() => archiveCourse(presc.id)} style={{ color: 'var(--text-muted)', border: '2px dashed var(--border)' }}>
                          Archive & Hide from Dashboard
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {prescriptions.length > 0 && (
          <div className="mt-8">
            {allCoursesFinished ? (
              <button className="btn btn-success btn-lg btn-full fade-in" onClick={() => navigate('/patient/recovery')} style={{ fontSize: '1.05rem' }}>
                All Courses Complete! Go to Recovery <ArrowRight size={20} />
              </button>
            ) : (
              <button className="btn btn-lg btn-full fade-in" disabled style={{ background: 'var(--bg-section)', color: 'var(--text-muted)', border: '2px dashed var(--border)', cursor: 'not-allowed' }}>
                🔒 Complete your full course to unlock Recovery
              </button>
            )}
          </div>
        )}

        <ChatPanel chatId={chatId} user={user} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>

      <SOSButton onPress={() => setShowSOS(true)} />
      {showSOS && <SOSModal user={user} prescriptionData={activePresc} onClose={() => setShowSOS(false)} />}
    </div>
  );
}
