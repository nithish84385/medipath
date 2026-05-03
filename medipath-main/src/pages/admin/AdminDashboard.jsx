import { useState, useEffect } from 'react';
import { LogOut, Clock, CheckCircle, Activity, UserSearch, Users, Pill, Search, XCircle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { DOCTORS_DB } from '../../data/doctors';

export default function AdminDashboard({ user, onLogout }) {
  const [queues, setQueues] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activePrescriptions, setActivePrescriptions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'scheduled' | 'rejected'

  useEffect(() => {
    const q = query(collection(db, 'queue_entries'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setQueues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Stats: total users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => setTotalUsers(snap.size));
    return () => unsub();
  }, []);

  // Stats: active prescriptions
  useEffect(() => {
    const q = query(collection(db, 'prescriptions'), where('status', '==', 'active'));
    const unsub = onSnapshot(q, snap => setActivePrescriptions(snap.size));
    return () => unsub();
  }, []);

  const handleAssignSlot = async (queueId) => {
    try {
      const record = queues.find(q => q.id === queueId);
      const preferred = record?.preferredSlots || [];
      const chosenTime = selectedSlots[queueId] || preferred[0] || new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await updateDoc(doc(db, 'queue_entries', queueId), {
        status: 'scheduled',
        appointmentTime: chosenTime,
        approvedAt: new Date().toISOString(),
      });
    } catch (err) { console.error(err); alert('Failed to assign slot'); }
  };

  const handleReject = async (queueId) => {
    if (!window.confirm('Reject this queue entry?')) return;
    try {
      await updateDoc(doc(db, 'queue_entries', queueId), {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
      });
    } catch (err) { console.error(err); alert('Failed to reject entry'); }
  };

  const filterBySearch = (list) => {
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(q =>
      (q.patientName || '').toLowerCase().includes(s) ||
      (q.patientEmail || '').toLowerCase().includes(s) ||
      (q.doctorName || '').toLowerCase().includes(s)
    );
  };

  const waitingQueues   = filterBySearch(queues.filter(q => q.status === 'waiting'));
  const scheduledQueues = filterBySearch(queues.filter(q => q.status === 'scheduled').sort((a,b) => new Date(b.approvedAt||0)-new Date(a.approvedAt||0)));
  const rejectedQueues  = filterBySearch(queues.filter(q => q.status === 'rejected'));

  const doctorLoad = {};
  queues.filter(q => q.status === 'waiting').forEach(q => {
    doctorLoad[q.doctorId] = (doctorLoad[q.doctorId] || 0) + 1;
  });
  const allDoctors = DOCTORS_DB.map(d => ({
    id: d.id, name: d.name,
    specialty: d.specialty || d.specialization,
    waitCount: doctorLoad[d.id] || 0,
  })).sort((a, b) => b.waitCount - a.waitCount).slice(0, 8);

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'var(--primary)' },
    { label: 'Pending Queue', value: waitingQueues.length, icon: Clock, color: 'var(--warning)' },
    { label: 'Scheduled Today', value: scheduledQueues.length, icon: CheckCircle, color: 'var(--success)' },
    { label: 'Active Rx', value: activePrescriptions, icon: Pill, color: '#8b5cf6' },
  ];

  const TabLabel = ({ tab, label, count }) => (
    <button onClick={() => setActiveTab(tab)}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
      style={{
        background: activeTab === tab ? '#8b5cf6' : 'transparent',
        color: activeTab === tab ? 'white' : 'var(--text-muted)',
        border: activeTab === tab ? 'none' : '2px solid var(--border)',
      }}>
      {label} {count > 0 && <span className="ml-1 opacity-80">({count})</span>}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <nav style={{ background: '#8b5cf6', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div className="admin-nav-inner">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Activity color="rgba(255,255,255,0.9)" /> MediPath Admin Console
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <span>Welcome, {user?.name || 'Administrator'}</span>
            <button className="btn" onClick={onLogout} style={{ background: 'rgba(0,0,0,0.2)', color: 'white' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="page-container-wide">
        {/* Stats */}
        <div className="grid gap-4 mb-8 fade-in" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {stats.map(s => (
            <div key={s.label} className="med-card card-pad-md text-center" style={{ padding: '20px 16px' }}>
              <s.icon size={22} style={{ color: s.color, margin: '0 auto 8px' }} />
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="admin-layout">
          {/* Left: Queue Management */}
          <div>
            {/* Search */}
            <div className="relative mb-5">
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by patient, doctor..."
                style={{ paddingLeft: 38 }}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              <TabLabel tab="pending"   label="Pending"   count={waitingQueues.length} />
              <TabLabel tab="scheduled" label="Scheduled" count={scheduledQueues.length} />
              <TabLabel tab="rejected"  label="Rejected"  count={rejectedQueues.length} />
            </div>

            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <>
                {loading ? (
                  <div className="text-center p-8" style={{ color: 'var(--text-muted)' }}>Loading queues...</div>
                ) : waitingQueues.length === 0 ? (
                  <div className="med-card text-center p-12" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                    No patients waiting in queue.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {waitingQueues.map(q => (
                      <div key={q.id} className="med-card card-pad-md fade-in queue-card-row" style={{ borderLeft: '4px solid var(--warning)' }}>
                        <div>
                          <div className="font-bold text-lg">{q.patientName}</div>
                          <div className="text-sm mt-1 flex flex-col gap-1" style={{ color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-2"><UserSearch size={14} /> Dr. <span className="font-semibold text-black">{q.doctorName}</span></div>
                            <div className="text-[11px] font-mono" style={{ color: 'var(--primary)' }}>{q.patientEmail}</div>
                          </div>
                          <div className="mt-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Preferred Slots</div>
                            {q.preferredSlots?.length ? (
                              <div className="meta-wrap">
                                {q.preferredSlots.map(slot => <span key={slot} className="badge badge-primary">{slot}</span>)}
                              </div>
                            ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No preferred slots.</span>}
                          </div>
                          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                            Joined: {new Date(q.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="actions-row" style={{ minWidth: 220 }}>
                          <select value={selectedSlots[q.id] || ''} onChange={e => setSelectedSlots(p => ({ ...p, [q.id]: e.target.value }))} style={{ minWidth: 150 }}>
                            <option value="">Auto-pick best slot</option>
                            {(q.preferredSlots || []).map(slot => <option key={slot} value={slot}>{slot}</option>)}
                          </select>
                          <button className="btn" onClick={() => handleAssignSlot(q.id)} style={{ background: '#8b5cf6', color: 'white', borderRadius: '8px', fontWeight: 600 }}>
                            ✓ Approve
                          </button>
                          <button className="btn" onClick={() => handleReject(q.id)} style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: '8px', fontWeight: 600, border: '1px solid var(--danger)' }}>
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Scheduled Tab */}
            {activeTab === 'scheduled' && (
              <div className="flex flex-col gap-3">
                {scheduledQueues.length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No scheduled appointments.</div>
                ) : (
                  scheduledQueues.map(q => (
                    <div key={q.id} className="p-4 rounded-xl" style={{ background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                      <div className="font-semibold">{q.patientName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>with</span> Dr. {q.doctorName}</div>
                      <div className="text-xs mt-1 flex gap-3" style={{ color: 'var(--text-muted)' }}>
                        <span>⏰ {q.appointmentTime}</span>
                        <span>Approved: {new Date(q.approvedAt || q.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Rejected Tab */}
            {activeTab === 'rejected' && (
              <div className="flex flex-col gap-3">
                {rejectedQueues.length === 0 ? (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No rejected entries.</div>
                ) : (
                  rejectedQueues.map(q => (
                    <div key={q.id} className="p-4 rounded-xl" style={{ background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div className="font-semibold" style={{ color: 'var(--danger)' }}>{q.patientName}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Dr. {q.doctorName} · Rejected: {q.rejectedAt ? new Date(q.rejectedAt).toLocaleString() : '—'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right: Doctor Workloads */}
          <div>
            <div className="med-card card-pad-md" style={{ position: 'sticky', top: '24px' }}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity size={18} color="#8b5cf6" /> Doctor Workloads
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Waiting patients per doctor.</p>
              <div className="flex flex-col gap-3">
                {allDoctors.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: d.waitCount > 0 ? 'rgba(139,92,246,0.05)' : 'transparent', border: '1px solid var(--border)' }}>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{d.name}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{d.specialty}</div>
                    </div>
                    {d.waitCount > 0
                      ? <span className="badge" style={{ background: '#8b5cf6', color: 'white' }}>{d.waitCount} waiting</span>
                      : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Idle</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
