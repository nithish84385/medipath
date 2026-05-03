import { useState } from 'react';
import { Stethoscope, User, ArrowRight, Loader2, Mail, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { auth, db, googleProvider } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [role, setRole] = useState('patient');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        // Login: just authenticate — role is fetched from Firestore in App.jsx
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        // Signup: only patient or doctor allowed (admin set via Firebase console)
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(userCred.user, { displayName: name.trim() });
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          name: name.trim(),
          role,            // 'patient' or 'doctor' only
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        // New Google user — set their chosen role
        await setDoc(docRef, {
          email: user.email,
          name: user.displayName,
          role,          // patient or doctor
          createdAt: new Date().toISOString(),
          authProvider: 'google',
        });
      }
      // Existing Google users: never overwrite their role
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) { setError('Please enter your email.'); return; }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  const roleColor = role === 'doctor' ? 'var(--primary)' : 'var(--success)';

  // ─── Forgot Password View ─────────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="login-wrapper">
        <div className="login-sidebar hidden md:flex">
          <div className="relative z-10 flex flex-col h-full fade-in">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md shadow-lg border border-white/20">
                <Stethoscope size={28} color="white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">MediPath</h1>
                <div className="text-xs text-white/70 font-semibold tracking-widest uppercase mt-1">Platform</div>
              </div>
            </div>
            <div className="mt-auto mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Reset your password</h2>
              <p className="text-white/80 leading-relaxed">We'll send a secure link to your email so you can get back in.</p>
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <div className="w-full max-w-[420px] mx-auto fade-in">
            <button onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(''); setError(''); }}
              className="flex items-center gap-2 text-sm font-semibold mb-8 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}>
              <ChevronLeft size={16} /> Back to Sign In
            </button>

            <h2 className="text-3xl font-extrabold mb-2 text-gray-900">Forgot Password?</h2>
            <p className="text-gray-500 mb-8">Enter your email and we'll send a reset link.</p>

            {resetSent ? (
              <div className="p-5 rounded-2xl text-center" style={{ background: 'var(--success-light)', border: '2px solid var(--success)' }}>
                <div className="text-3xl mb-3">✉️</div>
                <div className="font-bold text-lg mb-1" style={{ color: 'var(--success)' }}>Reset link sent!</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Check your inbox at <strong>{resetEmail}</strong>
                </div>
                <button onClick={() => { setShowForgot(false); setResetSent(false); }}
                  className="btn mt-5 w-full" style={{ background: 'var(--success)', color: 'white' }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-5">
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">Email Address</label>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    placeholder="name@example.com" onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm mb-4 p-4 rounded-xl font-medium"
                    style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">!</span>
                    {error}
                  </div>
                )}
                <button className="btn w-full py-3.5 rounded-xl font-bold text-white"
                  onClick={handleForgotPassword} disabled={loading}
                  style={{ background: loading ? 'var(--border)' : 'var(--primary)' }}>
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Send Reset Link'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Login / Register View ────────────────────────────────────────────────
  return (
    <div className="login-wrapper">
      {/* Left: Branding sidebar */}
      <div className="login-sidebar hidden md:flex">
        <div className="relative z-10 flex flex-col h-full fade-in">
          <div className="flex items-center gap-3 mb-16 delay-100">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md shadow-lg border border-white/20">
              <Stethoscope size={28} color="white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">MediPath</h1>
              <div className="text-xs text-white/70 font-semibold tracking-widest uppercase mt-1">Platform</div>
            </div>
          </div>
          <div className="mt-auto mb-12 delay-200 fade-in">
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              A new standard for <br /> connected healthcare
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-md leading-relaxed font-medium">
              Seamlessly connect patients, doctors, and facilities with intelligent matching and secure data flow.
            </p>
            <div className="flex flex-col gap-5">
              {[
                { icon: '✨', label: 'Intelligent symptoms analysis' },
                { icon: '🔒', label: 'Secure infrastructure' },
                { icon: '⚡', label: 'Real-time updates' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4 text-white/90 font-medium">
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-sm">
                    <span className="text-sm">{f.icon}</span>
                  </div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-10 text-[10px] text-white/40 tracking-widest font-semibold uppercase z-10">
          Powered by modern tech
        </div>
      </div>

      {/* Right: Form */}
      <div className="login-form-section">
        <div className="w-full max-w-[420px] fade-in mx-auto">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-gray-500 font-medium">
              {isLogin ? 'Enter your details to access your portal.' : 'Join the MediPath network.'}
            </p>
          </div>

          {/* Role Toggle — only meaningful for signup */}
          <div className="role-toggle fade-in delay-100 mb-6">
            {[
              { val: 'patient', icon: <User size={16} />, label: 'Patient' },
              { val: 'doctor', icon: <Stethoscope size={16} />, label: 'Doctor' },
            ].map(r => (
              <button key={r.val}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                onClick={() => setRole(r.val)}
                style={{
                  background: role === r.val ? 'white' : 'transparent',
                  color: role === r.val ? (r.val === 'doctor' ? 'var(--primary)' : 'var(--success)') : 'var(--text-muted)',
                  boxShadow: role === r.val ? 'var(--shadow-sm)' : 'none',
                }}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4 mb-6 fade-in delay-200">
            {!isLogin && (
              <div className="relative">
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            )}
            <div className="relative">
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">Email Address</label>
              <div className="relative">
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com" style={{ paddingLeft: 38 }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>
            <div className="relative">
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-500">Password</label>
              <div className="relative">
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {isLogin && (
            <div className="text-right mb-4">
              <button onClick={() => { setShowForgot(true); setError(''); }}
                className="text-sm font-semibold hover:underline transition-all"
                style={{ color: roleColor }}>
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm mb-5 p-4 rounded-xl font-medium"
              style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-xs">!</span>
              {error}
            </div>
          )}

          <div className="fade-in delay-300">
            <button className="btn flex justify-center items-center w-full py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mb-5"
              onClick={handleSubmit} disabled={loading}
              style={{ background: loading ? 'var(--border)' : roleColor, color: 'white' }}>
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : (
                <span className="flex items-center text-[15px] font-bold">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="ml-2" />
                </span>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-gray-400 font-medium tracking-wide">OR CONTINUE WITH</span>
              </div>
            </div>

            <button className="btn w-full flex items-center justify-center gap-3 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200 mb-6 font-semibold text-gray-700 bg-white"
              onClick={handleGoogleSignIn} disabled={loading}>
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
              Google
            </button>

            <div className="text-center text-sm font-medium text-gray-500">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="font-bold hover:underline transition-all" style={{ color: roleColor }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
