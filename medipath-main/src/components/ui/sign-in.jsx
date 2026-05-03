import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.801 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }) => (
  <div className="rounded-2xl border border-[var(--border)] bg-[var(--text-primary)]/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
      <p className="text-white/60">{testimonial.handle}</p>
      <p className="mt-1 text-white/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export function SignInPage({
  title,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  // MediPath-specific props
  extraFields,
  submitLabel = "Sign In",
  footerText,
  footerLinkText,
  footerAction,
  errorMessage,
  loading = false,
  roleToggle,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-[var(--bg)]">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight tracking-tighter text-[var(--text-primary)]">
              {title || <span className="font-light">Welcome</span>}
            </h1>
            <p className="animate-element animate-delay-200 text-[var(--text-muted)]">{description}</p>

            {roleToggle && (
              <div className="animate-element animate-delay-250">
                {roleToggle}
              </div>
            )}

            <form className="space-y-5" onSubmit={onSignIn}>
              {extraFields}

              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="Enter your email address" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-[var(--text-primary)]" />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-[var(--text-muted)] mb-1.5 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-[var(--text-primary)]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" /> : <Eye className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                  <span className="text-[var(--text-primary)]/90">Keep me signed in</span>
                </label>
                <button type="button" onClick={onResetPassword} className="hover:underline text-violet-500 transition-colors font-medium">
                  Reset password
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-sm p-4 rounded-xl font-medium animate-element"
                  style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 text-xs font-bold">!</span>
                  {errorMessage}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-[var(--primary)] py-4 font-semibold text-white hover:bg-[var(--primary-strong)] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    Processing...
                  </span>
                ) : submitLabel}
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-[var(--border)]"></span>
              <span className="px-4 text-sm text-[var(--text-muted)] bg-[var(--bg)] absolute">Or continue with</span>
            </div>

            <button onClick={onGoogleSignIn} disabled={loading}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-[var(--border)] rounded-2xl py-4 hover:bg-[var(--bg-section)] transition-colors font-medium text-[var(--text-primary)] disabled:opacity-50">
              <GoogleIcon />
              Continue with Google
            </button>

            {footerText && (
              <p className="animate-element animate-delay-900 text-center text-sm text-[var(--text-muted)]">
                {footerText}{' '}
                <button type="button" onClick={footerAction} className="text-violet-500 hover:underline transition-colors font-semibold">
                  {footerLinkText}
                </button>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}>
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center z-10">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default SignInPage;
