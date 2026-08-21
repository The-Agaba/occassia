import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import SEO from '../components/SEO';

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await authApi.login(data.email, data.password);
      setAuth(res.data.token, res.data.refreshToken, res.data.user);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <>
      <SEO 
        title="Login - Occassia Event Management"
        description="Sign in to Occassia to manage your wedding and event guests, track attendance, and streamline event operations."
        keywords="login, sign in, event management login, wedding guest management access"
      />
      <div className="min-h-screen flex">
      {/* Left - full-bleed event media */}
      <div className="hidden lg:block lg:w-[52%] xl:w-[55%] relative overflow-hidden bg-[#0c0f14]">
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

        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0f14]/95 via-[#0c0f14]/60 to-transparent" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 560 320" className="absolute -left-24 top-12 h-72 w-[34rem] opacity-70">
            <circle cx="120" cy="80" r="90" fill="rgba(212,184,150,0.18)" className="hero-shape hero-shape-1" />
            <rect x="260" y="40" width="160" height="160" rx="32" fill="rgba(255,255,255,0.08)" className="hero-shape hero-shape-2" />
            <ellipse cx="420" cy="210" rx="100" ry="60" fill="rgba(255,255,255,0.06)" className="hero-shape hero-shape-3" />
          </svg>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-12 xl:p-16">
          <div>
            <span className="text-[#d4b896] text-xs font-medium tracking-[0.3em] uppercase">
              Occassia Event Access Platform
            </span>
          </div>

          <div className="max-w-md">
            <h2 className="font-display text-4xl xl:text-5xl text-white font-medium leading-tight">
              Every guest.<br />
              <em className="text-[#d4b896] not-italic">Every moment.</em>
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
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 xl:px-24 py-12 bg-[#faf8f5] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute right-[-2rem] top-10 h-32 w-32 rounded-full border border-[#0c0f14]/10 bg-[#0c0f14]/5 form-shape form-shape-1" />
          <div className="absolute left-8 bottom-16 h-20 w-20 rounded-3xl border border-[#b8956a]/20 bg-[#b8956a]/10 form-shape form-shape-2" />
          <div className="absolute right-16 bottom-8 h-16 w-24 rounded-full border border-[#0c0f14]/10 bg-[#0c0f14]/5 form-shape form-shape-3" />
        </div>

        <div className="w-full max-w-sm mx-auto relative z-10">
          <div className="mb-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0c0f14]/10 bg-white shadow-sm">
              <img src="/new-favicon.svg" alt="Occassia logo" className="h-7 w-7" />
            </div>
            <h1 className="font-display text-4xl text-[#0c0f14] font-semibold tracking-tight">
              Occassia
            </h1>
            <p className="mt-2 text-[#6b7280] text-sm">
              Cotronix · Weddings & Events
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {deactivationMsg && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
                {deactivationMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-widest mb-2">
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
              <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-widest mb-2">
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
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary group">
              {isSubmitting ? (
                'Signing in…'
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
    </>
  );
}
