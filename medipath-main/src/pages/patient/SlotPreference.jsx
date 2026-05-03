import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Sunrise, Sunset, Moon, ArrowRight, CalendarClock } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import Navbar from '../../components/Navbar';
import SOSButton from '../../components/SOSButton';
import SOSModal from '../../components/SOSModal';
import { db } from '../../lib/firebase';

const SLOT_GROUPS = [
  { label: 'Morning', icon: Sunrise, slots: ['06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'] },
  { label: 'Afternoon', icon: Sun, slots: ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'] },
  { label: 'Evening', icon: Sunset, slots: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'] },
  { label: 'Night', icon: Moon, slots: ['08:00 PM', '08:30 PM', '09:00 PM'] }
];

export default function SlotPreference({ user, onLogout, onSelectDoctor }) {
  const [showSOS, setShowSOS] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const doctor = location.state?.doctor;
  const symptoms = location.state?.symptoms || [];

  const allSlots = useMemo(() => SLOT_GROUPS.flatMap((g) => g.slots), []);

  const toggleSlot = (slot) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) return prev.filter((s) => s !== slot);
      if (prev.length >= 3) return prev;
      return [...prev, slot];
    });
  };

  const submitPreference = async () => {
    if (!doctor || selectedSlots.length === 0) return;

    setSubmitting(true);
    try {
      const queueData = {
        patientId: user?.uid || 'unknown',
        patientEmail: (user?.email || '').toLowerCase(),
        patientName: user?.name || user?.email || 'Unknown Patient',
        doctorId: doctor.id,
        doctorName: doctor.name,
        status: 'waiting',
        timestamp: new Date().toISOString(),
        symptoms,
        preferredSlots: selectedSlots
      };

      const docRef = await addDoc(collection(db, 'queue_entries'), queueData);
      localStorage.setItem('medipath_current_queue', docRef.id);
      onSelectDoctor?.(doctor);
      navigate('/patient/queue-status');
    } catch (err) {
      console.error(err);
      alert('Failed to submit preferred slots. Please try again.');
      setSubmitting(false);
    }
  };

  if (!doctor) {
    navigate('/patient/match');
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={1} onLogout={onLogout} />

      <div className="page-container">
        <div className="section-header fade-in">
          <h1>Select Preferred Time Slots</h1>
          <p>Choose up to 3 preferred appointment times with Dr. {doctor.name}</p>
        </div>

        <div className="med-card card-pad-lg fade-in">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock size={20} color="var(--primary)" />
            <h3 className="font-bold">Available Slots</h3>
          </div>

          <div className="slot-groups">
            {SLOT_GROUPS.map((group) => (
              <div key={group.label} className="slot-group">
                <div className="slot-group-label">
                  <group.icon size={16} />
                  <span>{group.label}</span>
                </div>
                <div className="slot-grid">
                  {group.slots.map((slot) => {
                    const active = selectedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        className={`slot-btn ${active ? 'active' : ''}`}
                        onClick={() => toggleSlot(slot)}
                        disabled={!active && selectedSlots.length >= 3}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="med-card-flat mt-5" style={{ background: 'var(--bg-section)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Selected Preferences
            </div>
            <div className="meta-wrap">
              {selectedSlots.length === 0 ? (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No slot selected yet.</span>
              ) : (
                selectedSlots.map((s) => <span key={s} className="badge badge-primary">{s}</span>)
              )}
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full mt-6" disabled={selectedSlots.length === 0 || submitting} onClick={submitPreference}>
            {submitting ? 'Submitting...' : 'Submit Preferences & Join Queue'} <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <SOSButton onPress={() => setShowSOS(true)} />
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} doctorName={doctor?.name} />}
    </div>
  );
}
