import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Users, CheckCircle, Clock3, ArrowRight, Activity,
  MessageCircle, Loader2, ShieldAlert, Bell,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';

export default function DoctorDashboard({ user, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const navigate = useNavigate();

  const normalizeName = (v = '') =>
    v.toLowerCase().replace(/^dr\.?\s+/i, '').replace(/\s+/g, ' ').trim();

  // Live queue for this doctor
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'queue_entries'));
    const unsub = onSnapshot(q, snap => {
      const normalizedName = normalizeName(user?.name || '');
      const myQueue = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => {
          if (e.status !== 'scheduled') return false;
          return (
            e.doctorId === user.uid ||
            (e.doctorEmail || '').toLowerCase() === (user.email || '').toLowerCase() ||
            normalizeName(e.doctorName || '') === normalizedName
          );
        })
        .sort((a, b) => new Date(a.approvedAt || a.timestamp || 0) - new Date(b.approvedAt || b.timestamp || 0));
      setQueue(myQueue);
      setLoadingQueue(false);
    });
    return () => unsub();
  }, [user]);

  // Recent prescriptions by this doctor
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'prescriptions'),
      where('doctorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setRecentPrescriptions(snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.uid]);

  // Live SOS alerts for this doctor or unassigned generic alerts
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'sos_alerts'),
      where('resolved', '==', false)
    );
    const unsub = onSnapshot(q, snap => {
      const allAlerts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const myAlerts = allAlerts.filter(a => !a.doctorId || a.doctorId === user.uid);
      setSosAlerts(myAlerts);
    });
    return () => unsub();
  }, [user?.uid]);

  const resolveSOSAlert = async (alertId) => {
    try {
      await updateDoc(doc(db, 'sos_alerts', alertId), { resolved: true });
    } catch (e) { console.error(e); }
  };

  const stats = [
    { label: 'In Queue', value: queue.length, icon: Clock3, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Prescriptions', value: recentPrescriptions.length, icon: ClipboardList, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: 'SOS Alerts', value: sosAlerts.length, icon: Bell, color: sosAlerts.length > 0 ? 'var(--danger)' : 'var(--text-muted)', bg: sosAlerts.length > 0 ? 'var(--danger-light)' : 'var(--bg-section)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={0} onLogout={onLogout} />

      <div className="page-container">
        {/* Welcome */}
        <div className="med-card card-pad-lg mb-6 fade-in"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', border: 'none' }}>
          <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-1">Doctor Portal</p>
          <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>
            Dr. {user?.name} 🩺
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
            {queue.length === 0
              ? 'No patients scheduled right now. Check back soon.'
              : `You have ${queue.length} patient${queue.length > 1 ? 's' : ''} scheduled and waiting.`}
          </p>
        </div>

        {/* SOS Alerts Banner */}
        {sosAlerts.map(alert => (
          <div key={alert.id} className="med-card card-pad-md mb-4 fade-in"
            style={{ borderLeft: '4px solid var(--danger)', background: 'var(--danger-light)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'white' }}>
                <ShieldAlert size={20} color="var(--danger)" />
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: 'var(--danger)' }}>🚨 Emergency SOS from {alert.patientName}</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-danger btn-sm">Respond</button>
                <button className="btn btn-outline btn-sm" onClick={() => resolveSOSAlert(alert.id)}>Dismiss</button>
              </div>
            </div>
          </div>
        ))}

        {/* Stats */}
        <div className="grid gap-4 mb-6 fade-in" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {stats.map(s => (
            <div key={s.label} className="med-card card-pad-md text-center" style={{ padding: '20px 16px' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: s.bg }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 mb-6 fade-in" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <button onClick={() => navigate('/doctor/prescribe')}
            className="med-card text-left hover:-translate-y-1 transition-all duration-200"
            style={{ padding: '20px', border: '2px solid var(--primary)', cursor: 'pointer', background: 'white' }}>
            <ClipboardList size={22} color="var(--primary)" style={{ marginBottom: 10 }} />
            <div className="font-bold" style={{ color: 'var(--primary)' }}>Write Prescription</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Create a new treatment plan</div>
          </button>
          <button onClick={() => navigate('/patient/match')}
            className="med-card text-left hover:-translate-y-1 transition-all duration-200"
            style={{ padding: '20px', border: '2px solid var(--border)', cursor: 'pointer', background: 'white' }}>
            <Users size={22} color="var(--text-secondary)" style={{ marginBottom: 10 }} />
            <div className="font-bold">Patient Queue</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>View all scheduled patients</div>
          </button>
        </div>

        {/* Current Queue */}
        <div className="mb-6 fade-in">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock3 size={18} color="var(--warning)" /> Scheduled Patients
          </h2>
          {loadingQueue ? (
            <div className="flex items-center gap-3 p-6"><Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary)' }} /><span style={{ color: 'var(--text-muted)' }}>Loading queue...</span></div>
          ) : queue.length === 0 ? (
            <div className="med-card text-center p-8" style={{ border: '2px dashed var(--border)' }}>
              <CheckCircle size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
              <div className="font-semibold" style={{ color: 'var(--text-muted)' }}>No patients scheduled right now</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {queue.map((entry, i) => (
                <div key={entry.id} className="med-card card-pad-md fade-in"
                  style={{ borderLeft: '4px solid var(--primary)', animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-bold text-base">{entry.patientName || entry.patientEmail}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Slot: <strong>{entry.appointmentTime || 'TBD'}</strong> · {entry.patientEmail}
                      </div>
                      {entry.symptoms && (
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Symptoms: {Array.isArray(entry.symptoms) ? entry.symptoms.join(', ') : entry.symptoms}
                        </div>
                      )}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/doctor/prescribe')}>
                      <Activity size={14} /> Prescribe <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prescriptions */}
        {recentPrescriptions.length > 0 && (
          <div className="fade-in">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ClipboardList size={18} color="var(--primary)" /> Recent Prescriptions
            </h2>
            <div className="flex flex-col gap-3">
              {recentPrescriptions.map(p => (
                <div key={p.id} className="p-4 rounded-xl fade-in"
                  style={{ background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-semibold">{p.patientName || p.patientEmail}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {p.diagnosis || 'General'} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: p.status === 'active' ? 'var(--success-light)' : 'var(--bg-section)',
                      color: p.status === 'active' ? 'var(--success)' : 'var(--text-muted)',
                    }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
