import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

export default function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const remove = useUiStore((s) => s.removeToast);

  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => remove(t.id), 5000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove]);

  return (
    <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div key={t.id} className={`max-w-sm px-4 py-3 rounded-lg shadow-lg text-sm text-white ${t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
