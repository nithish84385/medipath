import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';

// Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import Prescriptions from './pages/doctor/Prescriptions';
import Timings from './pages/doctor/Timings';
import DietPlan from './pages/doctor/DietPlan';

// Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorMatch from './pages/patient/DoctorMatch';
import SlotPreference from './pages/patient/SlotPreference';
import QueueStatus from './pages/patient/QueueStatus';
import Medications from './pages/patient/Medications';
import Recovery from './pages/patient/Recovery';
import HealthHistory from './pages/patient/HealthHistory';
import ProfilePage from './pages/patient/ProfilePage';

import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// ─── Route Guard ──────────────────────────────────────────────────────────────
function RequireAuth({ children, requiredRole, user, loadingAuth }) {
  if (loadingAuth) return null;
  if (!user) return <Navigate to="/" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Auth listener — role ONLY from Firestore, never from localStorage
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: data.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              role: data.role || 'patient',   // role is ALWAYS from Firestore
            });
          } else {
            // Firestore doc not yet created (edge case: mid-registration)
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              role: 'patient',
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            role: 'patient',
          });
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    // Clear only non-sensitive localStorage keys that control flow
    localStorage.removeItem('medipath_current_queue');
    localStorage.removeItem('medipath_allow_new_appointment_once');
    localStorage.removeItem('medipath_allow_new_appointment_flow');
    sessionStorage.removeItem('medipath_prescriptionId');
    sessionStorage.removeItem('medipath_meds');
  };

  if (loadingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin"></div>
          <div className="text-[var(--text-muted)] font-semibold text-sm">Initializing MediPath...</div>
        </div>
      </div>
    );
  }

  // Determine initial redirect after login
  const homeRedirect = () => {
    if (!user) return '/';
    if (user.role === 'admin')  return '/admin/queue';
    if (user.role === 'doctor') return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={user ? <Navigate to={homeRedirect()} replace /> : <LoginPage />} />

        {/* ── Admin ─────────────────────────────────────────────────── */}
        <Route path="/admin/queue" element={
          <RequireAuth requiredRole="admin" user={user} loadingAuth={loadingAuth}>
            <AdminDashboard user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />

        {/* ── Doctor ────────────────────────────────────────────────── */}
        <Route path="/doctor/dashboard" element={
          <RequireAuth requiredRole="doctor" user={user} loadingAuth={loadingAuth}>
            <DoctorDashboard user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/doctor/prescribe" element={
          <RequireAuth requiredRole="doctor" user={user} loadingAuth={loadingAuth}>
            <Prescriptions user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/doctor/timings" element={
          <RequireAuth requiredRole="doctor" user={user} loadingAuth={loadingAuth}>
            <Timings user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/doctor/diet" element={
          <RequireAuth requiredRole="doctor" user={user} loadingAuth={loadingAuth}>
            <DietPlan user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />

        {/* ── Patient ───────────────────────────────────────────────── */}
        <Route path="/patient/dashboard" element={
          <RequireAuth requiredRole="patient" user={user} loadingAuth={loadingAuth}>
            <PatientDashboard user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/patient/match" element={
          <RequireAuth requiredRole="patient" user={user} loadingAuth={loadingAuth}>
            <DoctorMatch user={user} onLogout={handleLogout} onSelectDoctor={() => {}} />
          </RequireAuth>
        } />
        <Route path="/patient/select-slot" element={
          <RequireAuth requiredRole="patient" user={user} loadingAuth={loadingAuth}>
            <SlotPreference user={user} onLogout={handleLogout} onSelectDoctor={() => {}} />
          </RequireAuth>
        } />
        <Route path="/patient/queue-status" element={
          <RequireAuth requiredRole="patient" user={user} loadingAuth={loadingAuth}>
            <QueueStatus user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/patient/medications" element={
          <RequireAuth requiredRole="patient" user={user} loadingAuth={loadingAuth}>
            <Medications user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/patient/recovery" element={
          <RequireAuth requiredRole="patient" user={user} loadingAuth={loadingAuth}>
            <Recovery user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/patient/history" element={
          <RequireAuth requiredRole="patient" user={user} loadingAuth={loadingAuth}>
            <HealthHistory user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />
        <Route path="/patient/profile" element={
          <RequireAuth requiredRole="patient" user={user} loadingAuth={loadingAuth}>
            <ProfilePage user={user} onLogout={handleLogout} />
          </RequireAuth>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
