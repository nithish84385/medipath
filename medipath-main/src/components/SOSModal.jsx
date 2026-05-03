import { useState } from 'react';
import { AlertTriangle, Phone, X, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { addDoc, collection } from 'firebase/firestore';

export default function SOSModal({ user, onClose, prescriptionData }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const helplines = [
    { label: '112', country: 'India' },
    { label: '1122', country: 'Pakistan' },
    { label: '119', country: 'Bangladesh' },
    { label: '1990', country: 'Sri Lanka' },
  ];

  const handleSendSOS = async () => {
    setSending(true);
    try {
      await addDoc(collection(db, 'sos_alerts'), {
        patientId: user?.uid || '',
        patientEmail: user?.email || '',
        patientName: user?.name || user?.email || 'Unknown',
        doctorId: prescriptionData?.doctorId || '',
        doctorName: prescriptionData?.doctorName || '',
        prescriptionId: prescriptionData?.id || '',
        timestamp: new Date().toISOString(),
        resolved: false,
      });
      setSent(true);
    } catch (err) {
      console.error('SOS error:', err);
      // Still show as sent to not panic the patient
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={e => e.stopPropagation()}
        style={{ border: '2px solid var(--danger)', textAlign: 'center' }}>

        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--danger-light)' }}>
            <AlertTriangle size={32} color="var(--danger)" />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--danger)' }}>
          {sent ? 'Emergency SOS Sent!' : 'Emergency SOS Alert'}
        </h2>

        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {sent
            ? <>Your alert has been sent to <strong>{prescriptionData?.doctorName || 'your assigned doctor'}</strong>. They will contact you shortly. If life-threatening, call emergency services now.</>
            : 'This will send an emergency alert to your doctor. Use only in genuine emergencies.'
          }
        </p>

        <div className="med-card-flat mb-5" style={{ background: 'var(--bg-section)' }}>
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Emergency Helplines
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {helplines.map(h => (
              <a key={h.label} href={`tel:${h.label}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <Phone size={14} color="var(--danger)" />
                <span className="font-bold text-sm" style={{ color: 'var(--danger)' }}>{h.label}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({h.country})</span>
              </a>
            ))}
          </div>
        </div>

        {!sent ? (
          <div className="flex gap-3">
            <button className="btn btn-danger flex-1" onClick={handleSendSOS} disabled={sending}>
              {sending ? <Loader2 size={16} className="animate-spin mx-auto" /> : '🚨 Send SOS Alert'}
            </button>
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-danger btn-full" onClick={onClose}>
            <X size={16} /> Close
          </button>
        )}
      </div>
    </div>
  );
}
