import { useState } from 'react';
import { Stethoscope, User, ChevronLeft, Loader2 } from 'lucide-react';
import { SignInPage } from '../components/ui/sign-in';
import { auth, db, googleProvider } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// ─── Testimonials ───────────────────────────────────────────────────────────
const testimonials = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Sarah Chen",
    handle: "@patient",
    text: "MediPath made finding the right doctor effortless. The AI matching is incredible!"
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Dr. Marcus",
    handle: "@doctor",
    text: "Managing prescriptions and patient timelines has never been this seamless."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "David Martinez",
    handle: "@admin",
    text: "The queue management and real-time SOS alerts keep our facility running smoothly."
  },
];

// ─── Main Login Page ────────────────────────────────────────────────────────
export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [role, setRole] = useState('patient');

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const roleColor = role === 'doctor' ? 'var(--primary)' : 'var(--success)';

  // ── Auth Handlers ───────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') || '').toString().trim();
    const password = (formData.get('password') || '').toString();

    if (!email || !password || (!isLogin && !name.trim())) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name.trim() });
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          name: name.trim(),
          role,
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
        await setDoc(docRef, {
          email: user.email,
          name: user.displayName,
          role,
          createdAt: new Date().toISOString(),
          authProvider: 'google',
        });
      }
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

  // ── Forgot Password View ────────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
        <section className="flex-1 flex items-center justify-center p-8 bg-[var(--bg)]">
          <div className="w-full max-w-md">
            <button onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(''); setError(''); }}
              className="flex items-center gap-2 text-sm font-semibold mb-8 hover:opacity-70 transition-opacity text-[var(--text-muted)] animate-element animate-delay-100">
              <ChevronLeft size={16} /> Back to Sign In
            </button>

            <h1 className="animate-element animate-delay-200 text-4xl md:text-5xl font-semibold leading-tight tracking-tighter text-[var(--text-primary)] mb-3">
              Reset Password
            </h1>
            <p className="animate-element animate-delay-300 text-[var(--text-muted)] mb-8">
              Enter your email and we'll send a secure reset link.
            </p>

            {resetSent ? (
              <div className="p-6 rounded-2xl text-center animate-element animate-delay-400"
                style={{ background: 'var(--success-light)', border: '2px solid var(--success)' }}>
                <div className="text-4xl mb-3">✉️</div>
                <div className="font-bold text-lg mb-1" style={{ color: 'var(--success)' }}>Reset link sent!</div>
                <div className="text-sm text-[var(--text-muted)]">
                  Check your inbox at <strong>{resetEmail}</strong>
                </div>
                <button onClick={() => { setShowForgot(false); setResetSent(false); }}
                  className="mt-5 w-full rounded-2xl py-3.5 font-semibold text-white"
                  style={{ background: 'var(--success)' }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="animate-element animate-delay-400">
                  <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Email Address</label>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--text-primary)]/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-[var(--text-primary)]" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm p-4 rounded-xl font-medium"
                    style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-xs font-bold">!</span>
                    {error}
                  </div>
                )}

                <button className="animate-element animate-delay-500 w-full rounded-2xl py-4 font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  onClick={handleForgotPassword} disabled={loading}
                  style={{ background: loading ? 'var(--border)' : 'var(--primary)' }}>
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Send Reset Link'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right hero panel */}
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=2160&q=80)' }}>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
        </section>
      </div>
    );
  }

  // ── Role Toggle Component ───────────────────────────────────────────────
  const roleToggle = (
    <div className="flex rounded-2xl p-1.5 border border-[var(--border)] bg-[var(--bg-section)]">
      {[
        { val: 'patient', icon: <User size={16} />, label: 'Patient' },
        { val: 'doctor', icon: <Stethoscope size={16} />, label: 'Doctor' },
      ].map(r => (
        <button key={r.val} type="button"
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
  );

  // ── Name Field (only for signup) ────────────────────────────────────────
  const extraFields = !isLogin ? (
    <div className="animate-element animate-delay-250">
      <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Full Name</label>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--text-primary)]/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
        <input name="name" type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="John Doe"
          className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-[var(--text-primary)]" />
      </div>
    </div>
  ) : null;

  // ── Main Login / Signup View ────────────────────────────────────────────
  return (
    <SignInPage
      title={
        <span className="font-light text-[var(--text-primary)]">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </span>
      }
      description={isLogin ? 'Enter your details to access your portal.' : 'Join the MediPath healthcare network.'}
      heroImageSrc="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=2160&q=80"
      testimonials={testimonials}
      onSignIn={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={() => { setShowForgot(true); setError(''); }}
      onCreateAccount={() => { setIsLogin(true); setError(''); }}
      submitLabel={isLogin ? 'Sign In' : 'Create Account'}
      loading={loading}
      errorMessage={error}
      roleToggle={roleToggle}
      extraFields={extraFields}
      footerText={isLogin ? "Don't have an account?" : 'Already have an account?'}
      footerLinkText={isLogin ? 'Sign Up' : 'Sign In'}
      footerAction={() => { setIsLogin(!isLogin); setError(''); }}
    />
  );
}
