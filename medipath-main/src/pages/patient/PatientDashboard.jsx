import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Pill, HeartPulse, History, User, CalendarCheck,
  Clock, Activity, ArrowRight, Plus, Loader2,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import SOSButton from '../../components/SOSButton';
import SOSModal from '../../components/SOSModal';
import TriageAgentUI from '../../components/TriageAgentUI';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, onSnapshot as listenDoc } from 'firebase/firestore';

export default function PatientDashboard({ user, onLogout }) {
  const [showSOS, setShowSOS] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [queueEntry, setQueueEntry] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Listen for active prescription
  useEffect(() => {
    const email = (user?.email || '').toLowerCase().trim();
    if (!email) { setLoading(false); return; }

    const q = query(
      collection(db, 'prescriptions'),
      where('patientEmail', '==', email),
      where('status', '==', 'active')
    );
    const unsub = onSnapshot(q, snap => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setPrescription(sorted[0] || null);
      setLoading(false);
    });

    // Count past prescriptions
    const qAll = query(collection(db, 'prescriptions'), where('patientEmail', '==', email));
    const unsubAll = onSnapshot(qAll, snap => setHistoryCount(snap.size));

    return () => { unsub(); unsubAll(); };
  }, [user?.email]);

  // Listen for queue entry from localStorage
  useEffect(() => {
    const queueId = localStorage.getItem('medipath_current_queue');
    if (!queueId) return;
    const unsub = listenDoc(doc(db, 'queue_entries', queueId), snap => {
      if (snap.exists()) setQueueEntry({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, []);

  const maxDays = prescription?.medications?.length
    ? Math.max(...prescription.medications.map(m => parseInt(m.days) || 1)) : 0;
  const currentDay = prescription?.currentDay || 1;
  const allDone = maxDays > 0 && currentDay > maxDays;

  const todaysDoses = (prescription?.medications || []).flatMap(med => {
    const isActive = (prescription?.currentDay || 1) <= (parseInt(med.days) || 1);
    if (!isActive || !med.times?.length) return [];
    return med.times.map((_, ti) => Boolean(med.taken?.[ti]));
  });
  const takenToday = todaysDoses.filter(Boolean).length;
  const totalToday = todaysDoses.length;
  const compliance = totalToday > 0 ? Math.round(takenToday / totalToday * 100) : 0;

  // Determine patient state
  const inQueue = queueEntry && (queueEntry.status === 'waiting' || queueEntry.status === 'scheduled');
  const inTreatment = !!prescription && !allDone;
  const inRecovery = !!prescription && allDone;
  const noTreatment = !prescription && !inQueue;

  const quickLinks = [
    { label: 'Find a Doctor', icon: Stethoscope, path: '/patient/match', color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: 'My Medications', icon: Pill, path: '/patient/medications', color: 'var(--success)', bg: 'var(--success-light)' },
    { label: 'Recovery Plan', icon: HeartPulse, path: '/patient/recovery', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Health History', icon: History, path: '/patient/history', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'My Profile', icon: User, path: '/patient/profile', color: 'var(--text-secondary)', bg: 'var(--bg-section)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={0} onLogout={onLogout} />

      <div className="page-container">
        {/* Welcome Hero */}
        <div className="med-card card-pad-lg mb-6 fade-in"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)', border: 'none' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">Welcome back</p>
              <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
                {user?.name || 'Patient'} 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
                {noTreatment
                  ? "You have no active treatment. Find a doctor to get started."
                  : inQueue
                    ? `You're in queue with Dr. ${queueEntry?.doctorName}. Waiting for slot assignment.`
                    : inRecovery
                      ? "Your medication course is complete. Check your recovery plan!"
                      : `Day ${currentDay} of ${maxDays} — keep up the great work!`
                }
              </p>
            </div>
            <div className="flex flex-col items-center text-white/90">
              <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                {inTreatment ? `${compliance}%` : inQueue ? '⏳' : inRecovery ? '✅' : '🩺'}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                {inTreatment ? 'Today\'s Compliance' : inQueue ? 'In Queue' : inRecovery ? 'Course Done' : 'No Treatment'}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        )}

        {/* Status Card */}
        {!loading && (
          <>
            {inQueue && (
              <div className="med-card card-pad-md mb-6 fade-in" style={{ borderLeft: '4px solid var(--warning)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <Clock size={20} color="var(--warning)" />
                  <h2 className="font-bold text-lg">Queue Status</h2>
                  <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>
                    {queueEntry.status === 'waiting' ? 'Waiting' : 'Slot Assigned ✓'}
                  </span>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  Dr. <strong>{queueEntry.doctorName}</strong> — joined at {new Date(queueEntry.timestamp).toLocaleTimeString()}
                </p>
                {queueEntry.status === 'scheduled' && (
                  <div className="p-3 rounded-xl mb-4 font-bold text-center" style={{ background: 'var(--success-light)', color: 'var(--success)', border: '2px solid var(--success)' }}>
                    📅 Appointment: {queueEntry.appointmentTime}
                  </div>
                )}
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/patient/queue-status')}>
                  View Queue Status <ArrowRight size={14} />
                </button>
              </div>
            )}

            {inTreatment && (
              <div className="med-card card-pad-md mb-6 fade-in" style={{ borderLeft: '4px solid var(--primary)' }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Activity size={20} color="var(--primary)" />
                    <h2 className="font-bold text-lg">Today's Treatment</h2>
                  </div>
                  <span className="badge badge-primary">Day {currentDay} of {maxDays}</span>
                </div>
                <div className="compliance-bar-track mb-2">
                  <div className="compliance-bar-fill" style={{ width: `${compliance}%` }}></div>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  {takenToday} of {totalToday} doses taken · Prescribed by Dr. {prescription.doctorName}
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/patient/medications')}>
                  View & Mark Doses <ArrowRight size={14} />
                </button>
              </div>
            )}

            {inRecovery && (
              <div className="med-card card-pad-md mb-6 fade-in" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <HeartPulse size={20} color="var(--success)" />
                  <h2 className="font-bold text-lg">Recovery Phase</h2>
                  <span className="badge badge-success">Course Complete ✓</span>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  You've completed your {maxDays}-day course. Follow your recovery plan to stay healthy.
                </p>
                <button className="btn btn-success btn-sm" onClick={() => navigate('/patient/recovery')}>
                  Open Recovery Plan <ArrowRight size={14} />
                </button>
              </div>
            )}

            {noTreatment && (
              <div className="med-card card-pad-lg mb-6 fade-in text-center"
                style={{ border: '2px dashed var(--border)' }}>
                <Stethoscope size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
                <h3 className="font-bold text-lg mb-2">No Active Treatment</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  Describe your symptoms and our AI will match you with the best doctor.
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/patient/match')}>
                  <Plus size={16} /> Find a Doctor
                </button>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid gap-4 mb-6 fade-in" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
              {[
                { label: 'Total Visits', value: historyCount, icon: History, color: '#8b5cf6' },
                { label: 'Current Day', value: inTreatment ? `${currentDay}/${maxDays}` : '—', icon: CalendarCheck, color: 'var(--primary)' },
                { label: 'Today\'s Doses', value: totalToday > 0 ? `${takenToday}/${totalToday}` : '—', icon: Pill, color: 'var(--success)' },
              ].map(stat => (
                <div key={stat.label} className="med-card card-pad-md text-center" style={{ padding: '20px 16px' }}>
                  <stat.icon size={22} style={{ color: stat.color, margin: '0 auto 8px' }} />
                  <div className="text-2xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <h2 className="font-bold text-lg mb-4 fade-in">Quick Actions</h2>
            <div className="grid gap-3 mb-6 fade-in" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {quickLinks.map(link => (
                <button key={link.path} onClick={() => navigate(link.path)}
                  className="med-card text-left transition-all duration-200 hover:-translate-y-1"
                  style={{ padding: '18px 16px', border: '2px solid var(--border)', cursor: 'pointer', background: 'white' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: link.bg }}>
                    <link.icon size={18} style={{ color: link.color }} />
                  </div>
                  <div className="font-bold text-sm" style={{ color: link.color }}>{link.label}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <SOSButton onPress={() => setShowSOS(true)} />
      {showSOS && <SOSModal user={user} prescriptionData={prescription} onClose={() => setShowSOS(false)} />}
      <TriageAgentUI triggerSOS={() => setShowSOS(true)} />
    </div>
  );
}
