import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Heart, Droplets, AlertCircle, Save, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Unknown'];

export default function ProfilePage({ user, onLogout }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: '',
    age: '',
    bloodGroup: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          phone: data.phone || '',
          age: data.age || '',
          bloodGroup: data.bloodGroup || '',
          allergies: data.allergies || '',
          emergencyContact: data.emergencyContact || '',
          emergencyPhone: data.emergencyPhone || '',
        }));
      }
      setLoading(false);
    });
  }, [user?.uid]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">{label}</label>
      <input
        type={type}
        value={profile[key]}
        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar user={user} currentStep={0} onLogout={onLogout} />

      <div className="page-container">
        <div className="section-header fade-in">
          <h1>My Profile</h1>
          <p>Manage your personal medical information</p>
        </div>

        <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/patient/dashboard')}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Basic Info */}
            <div className="med-card card-pad-md fade-in" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
                  <User size={20} color="var(--primary)" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Personal Information</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Used by doctors to identify you</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {field('Full Name', 'name', 'text', 'Your full name')}
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">Email Address</label>
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <Mail size={14} /> {user?.email}
                    <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>(read-only)</span>
                  </div>
                </div>
                {field('Phone Number', 'phone', 'tel', '+91 9876543210')}
                {field('Age', 'age', 'number', '25')}
              </div>
            </div>

            {/* Medical Info */}
            <div className="med-card card-pad-md fade-in" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--success-light)' }}>
                  <Heart size={20} color="var(--success)" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Medical Information</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Critical for your care team</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">Blood Group</label>
                  <select value={profile.bloodGroup} onChange={e => setProfile(p => ({ ...p, bloodGroup: e.target.value }))}>
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">Known Allergies</label>
                  <input
                    type="text"
                    value={profile.allergies}
                    onChange={e => setProfile(p => ({ ...p, allergies: e.target.value }))}
                    placeholder="e.g. Penicillin, Aspirin, Peanuts"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="med-card card-pad-md fade-in" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--danger-light)' }}>
                  <AlertCircle size={20} color="var(--danger)" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Emergency Contact</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reached in case of emergency</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {field('Contact Name', 'emergencyContact', 'text', 'Family member or friend')}
                {field('Contact Phone', 'emergencyPhone', 'tel', '+91 9876543210')}
              </div>
            </div>

            {/* Save */}
            {saved && (
              <div className="flex items-center gap-3 p-4 rounded-xl fade-in"
                style={{ background: 'var(--success-light)', border: '2px solid var(--success)' }}>
                <CheckCircle size={20} color="var(--success)" />
                <span className="font-semibold" style={{ color: 'var(--success)' }}>Profile saved successfully!</span>
              </div>
            )}
            <button className="btn btn-primary btn-lg btn-full fade-in" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={18} className="animate-spin mx-auto" /> : <><Save size={18} /> Save Profile</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
