import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import SEO from '../components/SEO';
import { ThemeToggle } from '../components/ThemeProvider';
import { apiErrorMessage } from '../lib/errorMessages';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const EVENT_VIDEO = '/login-video.mp4';
const EVENT_POSTER = '/login-poster.svg';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const deactivationMsg = (location.state as any)?.message as string | undefined;
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!isSubmitting) {
      setSlowRequest(false);
      return;
    }
    const timer = window.setTimeout(() => setSlowRequest(true), 15000);
    return () => window.clearTimeout(timer);
  }, [isSubmitting]);

  useEffect(() => {
    // A direct /login visit should still have the public landing page behind it,
    // so the browser back gesture never strands the user outside the app flow.
    const historyIndex = window.history.state?.idx;
    if (historyIndex === 0 || (historyIndex == null && window.history.length <= 1)) {
      navigate('/', { replace: true });
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Warm the first authenticated route while the user is entering credentials.
    // This keeps the dashboard chunk from becoming a second visible wait.
    void import('./DashboardPage');
  }, []);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await authApi.login(data.email, data.password);
      setAuth(res.data.token, res.data.refreshToken, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (requestError: unknown) {
      const axiosError = requestError as any;
      const message = axiosError?.response?.data?.error === 'INVALID_CREDENTIALS'
        ? 'Email or password is incorrect.'
        : axiosError?.response?.status === 401
          ? 'The sign-in service rejected the request without confirming your credentials. Please try again.'
        : apiErrorMessage(requestError, 'Sign-in could not be completed. Please try again.');
      setError(message);
    }
  };

  return (
    <>
      <SEO 
        title="Login - Occassia Event Management"
        description="Sign in to Occassia to manage your wedding and event guests, track attendance, and streamline event operations."
        keywords="login, sign in, event management login, wedding guest management access"
        noIndex={true}
      />
      <div className="min-h-screen flex">
      {/* Left - full-bleed event media */}
      <div className="hidden lg:block lg:w-[52%] xl:w-[55%] relative overflow-hidden login-brand-panel">
        {!videoFailed ? (
          <>
            {!videoLoaded && (
              <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                style={{ backgroundImage: `url(${EVENT_POSTER})` }}
              />
            )}
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={EVENT_POSTER}
              onError={() => setVideoFailed(true)}
              onCanPlay={() => setVideoLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src={EVENT_VIDEO} type="video/mp4" />
            </video>
          </>
        ) : (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${EVENT_POSTER})` }} />
        )}

        <div className="absolute inset-0 login-hero-overlay" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 560 320" className="absolute -left-24 top-12 h-72 w-[34rem] opacity-70">
            <circle cx="120" cy="80" r="90" fill="rgba(212,184,150,0.18)" className="hero-shape hero-shape-1" />
            <rect x="260" y="40" width="160" height="160" rx="32" fill="rgba(255,255,255,0.08)" className="hero-shape hero-shape-2" />
            <ellipse cx="420" cy="210" rx="100" ry="60" fill="rgba(255,255,255,0.06)" className="hero-shape hero-shape-3" />
          </svg>
          <div className="login-particle-field" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <span key={index} className={`login-particle login-particle-${index + 1}`} />)}
          </div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-12 xl:p-16">
          <div>
            <span className="login-accent text-xs font-medium tracking-[0.3em] uppercase">
              Occassia Event Access Platform
            </span>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-4xl xl:text-5xl text-white font-medium leading-tight">
              Every guest.<br />
              <em className="login-accent not-italic">Every moment.</em>
            </h2>
            <p className="mt-4 text-white/70 text-sm leading-relaxed max-w-sm">
              Seamless check-in, live attendance, and guest management for weddings and events of every scale.
            </p>
          </div>

          <p className="text-white/40 text-xs tracking-wide">
            Stock footage · Pexels
          </p>
        </div>
      </div>

      {/* Right - clean open form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 xl:px-24 py-12 login-surface relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute right-[-2rem] top-10 h-32 w-32 rounded-full login-bubble login-bubble-1 form-shape form-shape-1" />
          <div className="absolute left-8 bottom-16 h-20 w-20 rounded-3xl login-bubble login-bubble-2 form-shape form-shape-2" />
          <div className="absolute right-16 bottom-8 h-16 w-24 rounded-full login-bubble login-bubble-3 form-shape form-shape-3" />
        </div>

        <div className="login-theme-control"><ThemeToggle /></div>
        <div className="w-full max-w-sm mx-auto relative z-10">
          <div className="mb-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl login-logo-frame shadow-sm">
              <img src="/new-favicon.svg" alt="Occassia logo" className="h-7 w-7" />
            </div>
            <h1 className="font-display text-4xl login-heading font-semibold tracking-tight">
              Occassia
            </h1>
            <p className="mt-2 login-muted text-sm">
              Cotronix · Weddings & Events
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" aria-busy={isSubmitting}>
            {isSubmitting && (
              <div className="login-request-status" role="status" aria-live="polite">
                <span className="login-request-spinner" />
                <span>{slowRequest ? 'We are still waiting for a response.' : 'Contacting the secure sign-in service…'}</span>
              </div>
            )}
            <fieldset disabled={isSubmitting} className="login-form-controls">
            {deactivationMsg && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
                {deactivationMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium login-label uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="input-underline"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-2">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium login-label uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-underline pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-2">{errors.password.message}</p>
              )}
            </div>

            {error && (
            <p className="text-red-600 text-sm" role="alert">{error}</p>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary group">
              {isSubmitting ? (
                slowRequest ? 'Waking the server… still waiting' : 'Signing in…'
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </button>
            </fieldset>
          </form>

        </div>
      </div>
    </div>
    </>
  );
}
