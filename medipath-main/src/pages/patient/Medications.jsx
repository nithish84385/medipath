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

  // In-app visible reminder state (works on tablets where Notification API is blocked)
  const [activeReminders, setActiveReminders] = useState([]);
  const [dismissedReminders, setDismissedReminders] = useState(new Set());
  const audioRef = useRef(null);

  // Medication reminders — in-app banner + browser Notification fallback
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      if (prescriptions.length === 0) return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toDateString();
      const pending = [];

      prescriptions.forEach(p => {
        const currentDay = p.currentDay || 1;
        p.medications.forEach((med, mi) => {
          if (med.times && med.taken) {
            const maxDays = parseInt(med.days) || 1;
            if (currentDay > maxDays) return; // course finished for this med

            med.times.forEach((time, ti) => {
              const key = `${p.id}-${mi}-${ti}-${today}`;
              if (!med.taken[ti] && !dismissedReminders.has(key)) {
                // Check if this time is now or in the past (due today)
                const [tH, tM] = time.split(':').map(Number);
                const [nH, nM] = [now.getHours(), now.getMinutes()];
                const timeDiffMin = (nH * 60 + nM) - (tH * 60 + tM);

                if (timeDiffMin >= 0 && timeDiffMin <= 30) {
                  // Due right now or within last 30 min
                  pending.push({
                    key,
                    prescriptionId: p.id,
                    medIndex: mi,
                    timeIndex: ti,
                    medName: med.name,
                    dosage: med.dosage,
                    instruction: med.instruction,
                    time,
                    isNow: timeDiffMin <= 1,
                  });

                  // Browser notification (if supported)
                  if (timeDiffMin <= 1 && !notifiedSet.current.has(key)) {
                    notifiedSet.current.add(key);
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification('MediPath: Time for your medicine', {
                        body: `Take ${med.dosage} of ${med.name} (${med.instruction}).`,
                        icon: '/pwa-192x192.png',
                      });
                    }
                    // Play audio chime
                    try {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch(() => {});
                      }
                    } catch(e) { /* audio blocked on some browsers */ }
                  }
                }
              }
            });
          }
        });
      });

      setActiveReminders(pending);
    }, 15000); // Check every 15 seconds for tablet responsiveness

    return () => clearInterval(interval);
  }, [prescriptions, dismissedReminders]);

  const dismissReminder = (key) => {
    setDismissedReminders(prev => new Set([...prev, key]));
  };

  const snoozeReminder = (key) => {
    // Dismiss now, it will reappear on the next check cycle
    dismissReminder(key);
    setTimeout(() => {
      setDismissedReminders(prev => {
        const next = new Set([...prev]);
        next.delete(key);
        return next;
      });
    }, 5 * 60 * 1000); // Snooze for 5 minutes
  };

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
  const compliance = totalDoses > 0 ? Math.round(takenDoses / totalDoses * 100) : null;
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

        {/* 🔔 Today's Medication Schedule — Always Visible */}
        {!loading && prescriptions.length > 0 && (() => {
          const now = new Date();
          const nH = now.getHours(), nM = now.getMinutes();
          const nowMin = nH * 60 + nM;
          const presc = prescriptions[0];
          const allSlots = [];

          presc.medications.forEach((med, mi) => {
            if (med.times && med.times.length > 0) {
              med.times.forEach((time, ti) => {
                const [tH, tM] = (time || '').split(':').map(Number);
                const timeMin = (tH || 0) * 60 + (tM || 0);
                const taken = med.taken?.[ti] || false;
                const diffMin = nowMin - timeMin;

                let status = 'upcoming';
                if (taken) status = 'taken';
                else if (diffMin >= 0 && diffMin <= 30) status = 'due';
                else if (diffMin > 30) status = 'missed';

                allSlots.push({
                  key: `${presc.id}-${mi}-${ti}`,
                  prescriptionId: presc.id,
                  medIndex: mi,
                  timeIndex: ti,
                  medName: med.name,
                  dosage: med.dosage,
                  instruction: med.instruction,
                  time: time || '--:--',
                  timeMin,
                  status,
                  taken,
                });
              });
            }
          });

          allSlots.sort((a, b) => a.timeMin - b.timeMin);

          if (allSlots.length === 0) return null;

          const statusColors = {
            taken:    { bg: 'var(--success-light)', border: 'var(--success)', text: 'var(--success)', icon: '✅', label: 'Taken' },
            due:      { bg: 'var(--danger-light)',  border: 'var(--danger)',  text: 'var(--danger)',  icon: '⏰', label: 'Take Now!' },
            missed:   { bg: '#FFF7ED',              border: '#F97316',        text: '#EA580C',        icon: '⚠️', label: 'Missed' },
            upcoming: { bg: 'var(--bg-section)',     border: 'var(--border)',  text: 'var(--text-secondary)', icon: '🕐', label: 'Upcoming' },
          };

          return (
            <div className="med-card card-pad-md mb-6 fade-in" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="card-head mb-5">
                <div className="card-head-left">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
                    <Bell size={22} color="var(--primary)" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Today's Schedule</h2>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {allSlots.filter(s => s.status === 'taken').length}/{allSlots.length} doses completed
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {allSlots.map(slot => {
                  const c = statusColors[slot.status];
                  return (
                    <div key={slot.key}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl transition-all"
                      style={{
                        background: c.bg,
                        border: `1.5px solid ${c.border}`,
                        animation: slot.status === 'due' ? 'pulse-ring 2.5s ease-out infinite' : 'none',
                      }}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="text-2xl flex-shrink-0">{c.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm" style={{ color: c.text }}>{slot.medName} — {slot.dosage}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {slot.instruction} · {slot.time}
                          </div>
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0"
                          style={{ background: `${c.border}20`, color: c.text }}>
                          {c.label}
                        </span>
                      </div>

                      {!slot.taken && (
                        <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                          <button className="btn btn-sm flex-1 sm:flex-none font-bold"
                            style={{ background: slot.status === 'due' ? 'var(--danger)' : 'var(--primary)', color: 'white', minHeight: '40px' }}
                            onClick={() => markTaken(slot.prescriptionId, slot.medIndex, slot.timeIndex)}>
                            <CheckCircle2 size={14} /> Mark Taken
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Hidden audio chime for tablet alerts */}
        <audio ref={audioRef} preload="auto"
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczIj+r2teleC0qeli60NssCAAFH2qo3fJ6HRYKK3W45OJ0EA0OKIOz4d9xDAoNJnu23+RyDgkNHXCw2eFzDAkMG2us1N1vCwkLGmes0NlsCgoJGGSqztdqCQkJF2KozdVpCAkIF2GnzNRnCAkHFmCmzNNnBwgHFV+ly9JmBwgHFV+lytFmBggGFF6ky9FmBggGFF6ky9FlBgcGFF6ky9Fl" />


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
                  {compliance !== null ? (
                    <span className="text-2xl font-black" style={{ color: compliance >= 60 ? 'var(--success)' : 'var(--warning)' }}>
                      {compliance}%
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded-full">
                      Awaiting Doctor's Schedule
                    </span>
                  )}
                </div>
              </div>
              <div className="compliance-bar-track">
                <div className="compliance-bar-fill" style={{ width: `${compliance}%` }}></div>
              </div>
              <div className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                {totalDoses > 0 ? `${takenDoses} of ${totalDoses} doses taken` : '0 doses scheduled for today yet'}
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
