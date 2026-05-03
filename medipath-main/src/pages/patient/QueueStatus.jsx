import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CalendarCheck, ArrowRight, User } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from '../../components/Navbar';
import SOSButton from '../../components/SOSButton';
import SOSModal from '../../components/SOSModal';

export default function QueueStatus({ user, onLogout }) {
  const [queueData, setQueueData] = useState(null);
  const [showSOS, setShowSOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const queueId = localStorage.getItem('medipath_current_queue');
    if (!queueId) {
      navigate('/patient/match');
      return;
    }

    const unsub = onSnapshot(doc(db, 'queue_entries', queueId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log('Queue Status Update:', data.status);
        setQueueData({ id: snapshot.id, ...data });
      }
    }, (error) => {
      console.error('Queue Listener Error:', error);
      alert('Lost connection to live queue. Please refresh.');
    });
    return () => unsub();
  }, [navigate]);

  const handleProceed = () => {
    localStorage.removeItem('medipath_current_queue');
    localStorage.removeItem('medipath_allow_new_appointment_flow');
    navigate('/patient/medications');
  };

  // Manual "Acknowledge & Proceed" flow
  /*
  useEffect(() => {
    if (queueData && queueData.status !== 'waiting') {
      const timer = setTimeout(() => {
        handleProceed();
      }, 100); // 0.1s delay for instant transition
      return () => clearTimeout(timer);
    }
  }, [queueData, navigate]); // eslint-disable-line react-hooks/exhaustive-deps
  */

  if (!queueData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin"></div>
          <div className="text-[var(--text-muted)] font-semibold text-sm">Loading queue status...</div>
        </div>
      </div>
    );
  }

  const isWaiting = queueData.status === 'waiting';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={2} onLogout={onLogout} />

      <div className="page-container-narrow fade-in">
        <div className="med-card card-pad-lg text-center">
          
          {isWaiting ? (
            <>
              <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Clock size={40} color="var(--warning)" className="animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold mb-3">You're in the Queue</h1>
              <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto leading-relaxed">
                We've sent your request to <strong>{queueData.doctorName}</strong>. 
                Please wait while the scheduling administrator assigns your appointment slot.
              </p>
              
              <div className="p-4 rounded-xl text-left bg-[var(--bg-section)] border border-[var(--border)] inline-block w-full max-w-[320px] mb-6">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Queue Entry Time</div>
                <div className="font-medium">{new Date(queueData.timestamp).toLocaleTimeString()}</div>
              </div>

              <div className="flex flex-col gap-3 items-center">
                <button
                  className="btn btn-outline"
                  onClick={() => window.location.reload()}
                  style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                  Check Status Again
                </button>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => {
                    localStorage.removeItem('medipath_current_queue');
                    localStorage.removeItem('medipath_allow_new_appointment_flow');
                    navigate('/patient/match');
                  }}
                  style={{ color: 'var(--text-muted)' }}>
                  Cancel Request & Start Over
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <CalendarCheck size={40} color="var(--success)" />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-[var(--success)]">Slot Assigned!</h1>
              <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto leading-relaxed">
                Your appointment with <strong>{queueData.doctorName}</strong> has been scheduled.
              </p>
              
              <div className="p-5 rounded-2xl mb-8 border-2 border-[var(--success)] bg-white mx-auto inline-block w-full max-w-[320px]">
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--success)' }}>Your Appointment Time</div>
                <div className="text-3xl font-black">{queueData.appointmentTime}</div>
              </div>

              <div>
                <button className="btn btn-lg btn-primary w-full max-w-[280px]" onClick={handleProceed} style={{ fontSize: '1.05rem' }}>
                  Acknowledge & Proceed <ArrowRight size={20} />
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      <SOSButton onPress={() => setShowSOS(true)} />
      {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
    </div>
  );
}

