import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  useLogo?: boolean;
}

/**
 * Unified inline loading spinner used throughout the app.
 * Keeps all loading indicators visually consistent.
 * Can use either the lucide spinner or the app logo.
 */
export default function Spinner({ text = 'Loading…', className = '', size = 'md', useLogo = false }: SpinnerProps) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;
  const logoSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';

  if (useLogo) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
        <img src="/new-favicon.svg" alt="Loading" className={`${logoSize} animate-spin-slow`} />
        {text && <span className="text-sm text-slate-500">{text}</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-2 text-[#b8956a] ${className}`}>
      <Loader2 size={iconSize} className="animate-spin" />
      {text && <span className="text-sm text-slate-500">{text}</span>}
    </div>
  );
}
