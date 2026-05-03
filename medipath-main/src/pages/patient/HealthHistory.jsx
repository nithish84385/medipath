import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft, Pill, CalendarDays, UploadCloud, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import Navbar from '../../components/Navbar';
import SOSButton from '../../components/SOSButton';
import SOSModal from '../../components/SOSModal';
import { db } from '../../lib/firebase';
import { parseMedicalImage } from '../../utils/visionParser';

export default function HealthHistory({ user, onLogout }) {
  const [showSOS, setShowSOS] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        const parsedData = await parseMedicalImage(base64Data, file.type);
        
        if (parsedData) {
          // Save the OCR result to Firestore as an archived record
          await addDoc(collection(db, 'prescriptions'), {
            patientEmail: user?.email.toLowerCase(),
            patientName: user?.name || 'Patient',
            doctorName: 'External Record (OCR)',
            diagnosis: parsedData.diagnosis || 'Unknown',
            symptoms: parsedData.symptoms || 'Unknown',
            medications: parsedData.medications || [],
            status: 'archived',
            source: 'ocr',
            createdAt: new Date().toISOString()
          });
          alert('Record successfully scanned and saved!');
        } else {
          alert('Could not extract information from the image. Please try a clearer photo.');
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error processing document.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const email = (user?.email || '').toLowerCase().trim();
    if (!email) { setLoading(false); return; }

    // Use proper Firestore where — no full-collection scan
    const q = query(collection(db, 'prescriptions'), where('patientEmail', '==', email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      // Show all except the current active one
      const latestActive = all.find(p => p.status === 'active');
      setHistory(all.filter(p => p.id !== latestActive?.id));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.email]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={0} onLogout={onLogout} />
      <div className="page-container">
        <div className="section-header fade-in">
          <h1>Health History</h1>
          <p>View your previous treatment and medication records</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/patient/medications')}>
            <ArrowLeft size={14} /> Back to Medications
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={isScanning}
            />
            <button className="btn btn-primary btn-sm" disabled={isScanning}>
              {isScanning ? <><Loader2 size={14} className="animate-spin mr-1" /> Scanning...</> : <><UploadCloud size={14} className="mr-1" /> Upload Old Record</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="med-card text-center p-10">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="med-card text-center p-10">
            <History size={34} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <div className="font-semibold mb-1">No previous health history found</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Past prescriptions will appear here once archived.</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map(item => (
              <div key={item.id} className="med-card card-pad-md fade-in">
                <div className="card-head mb-3">
                  <div className="meta-wrap">
                    <span className="badge badge-primary">Dr. {item.doctorName || 'Unknown'}</span>
                    <span className="badge badge-neutral">{item.diagnosis || 'General Treatment'}</span>
                    <span className="badge badge-success">{item.status || 'archived'}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    <CalendarDays size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Date unknown'}
                  </div>
                </div>
                <div className="grid-2">
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Symptoms</div>
                    <div className="text-sm">{item.symptoms || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Medications</div>
                    {(item.medications || []).length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {item.medications.map((m, i) => (
                          <div key={i} className="p-2 rounded-lg text-sm" style={{ background: 'var(--bg-section)', border: '1px solid var(--border)' }}>
                            <div className="font-semibold flex items-center gap-2"><Pill size={13} /> {m.name || 'Unnamed'}</div>
                            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              {m.dosage || '—'} | {m.instruction || '—'} | {m.days || 1} day(s)
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>No medications recorded</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SOSButton onPress={() => setShowSOS(true)} />
      {showSOS && <SOSModal user={user} onClose={() => setShowSOS(false)} />}
    </div>
  );
}
