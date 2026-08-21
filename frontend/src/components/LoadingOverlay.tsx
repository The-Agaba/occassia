import { useUiStore } from '../store/uiStore';
import Spinner from './Spinner';

export default function LoadingOverlay() {
  const loading = useUiStore((s) => s.loading);
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Spinner text="Loading…" useLogo={true} size="lg" />
    </div>
  );
}
