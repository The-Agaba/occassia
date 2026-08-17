import { useUiStore } from '../store/uiStore';

export default function LoadingOverlay() {
  const loading = useUiStore((s) => s.loading);
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex flex-col items-center gap-4">
        <img src="/new-favicon.svg" alt="logo" className="h-20 w-20 animate-spin-slow" />
        <div className="text-white text-sm">Loading…</div>
      </div>
    </div>
  );
}
