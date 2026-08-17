import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, UserRound } from 'lucide-react';
import Logo from '../components/Logo';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login, signup, googleLogin } = useAuth();

  const [mode, setMode] = useState('login'); // login | signup
  const [form, setForm] = useState({ name: '', identifier: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const finish = () => navigate(redirect, { replace: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (mode === 'login') {
      if (!form.identifier.trim() || !form.password) {
        setError('Please enter your email/phone and password.');
        setSubmitting(false);
        return;
      }
      const res = await login(form.identifier.trim(), form.password);
      setSubmitting(false);
      if (res.error) return setError(res.error);
      finish();
    } else {
      if (!form.name.trim()) {
        setError('Please enter your name.');
        setSubmitting(false);
        return;
      }
      if (!/^\d{10}$/.test(form.phone.trim())) {
        setError('Please enter a valid 10-digit phone number.');
        setSubmitting(false);
        return;
      }
      if (!form.identifier.trim()) {
        setError('Please enter your email address.');
        setSubmitting(false);
        return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.');
        setSubmitting(false);
        return;
      }
      if (form.password !== form.confirm) {
        setError('Passwords do not match.');
        setSubmitting(false);
        return;
      }
      const res = await signup({
        name: form.name.trim(),
        email: form.identifier.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      setSubmitting(false);
      if (res.error) return setError(res.error);
      finish();
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    const res = await googleLogin();
    setSubmitting(false);
    if (res.error) return setError(res.error);
    finish();
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    try {
      await authApi.forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card p-6 sm:p-8">
          {/* Mode tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
            {(['login', 'signup']).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
                className={`rounded-full py-2 text-sm font-bold transition-all ${
                  mode === m
                    ? 'bg-white text-brand-600 shadow-sm dark:bg-zinc-900 dark:text-brand-400'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {m === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          <h1 className="font-display text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
            {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {mode === 'login' ? 'Login to continue ordering delicious food.' : 'Sign up in seconds and start ordering.'}
          </p>

          {/* Google (demo social login) */}
          <button
            onClick={handleGoogle}
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-bold text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md active:scale-[0.98] disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" /> or <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label" htmlFor="signup-name">Full name</label>
                <div className="relative">
                  <UserRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input id="signup-name" className="input pl-10" placeholder="Aarav Mehta" value={form.name} onChange={set('name')} />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="identifier">{mode === 'signup' ? 'Email' : 'Email or phone'}</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  id="identifier"
                  className="input pl-10"
                  placeholder={mode === 'signup' ? 'you@example.com' : 'you@example.com or 9876543210'}
                  value={form.identifier}
                  onChange={set('identifier')}
                  autoComplete="email"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="label" htmlFor="signup-phone">Phone number</label>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input id="signup-phone" className="input pl-10" inputMode="numeric" maxLength={10} placeholder="9876543210" value={form.phone} onChange={set('phone')} />
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-11"
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="label" htmlFor="confirm">Confirm password</label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input id="confirm" type={showPassword ? 'text' : 'password'} className="input pl-10" placeholder="Repeat your password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setForgotEmail('');
                    setForgotOpen(true);
                  }}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-ember-50 px-4 py-2.5 text-sm font-medium text-ember-600 dark:bg-ember-500/10 dark:text-ember-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 disabled:opacity-70">
              {submitting
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Login'
                  : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Accounts are stored securely in the FoodRush backend (bcrypt + JWT).
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link to="/" className="font-semibold text-brand-600 hover:underline">← Back to home</Link>
        </p>
      </div>

      {/* Forgot password modal */}
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset your password" icon="🔑">
        {forgotSent ? (
          <div className="text-center">
            <p className="text-4xl">📩</p>
            <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Reset link sent!</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              If an account exists for <strong>{forgotEmail}</strong>, you'll receive a link to reset your password.
            </p>
            <button onClick={() => setForgotOpen(false)} className="btn-primary mt-5 w-full py-3">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Enter your account email and we'll send you a reset link.</p>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input className="input pl-10" type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              Send reset link
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
