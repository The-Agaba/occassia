import { useUiStore } from '../store/uiStore';

export default function ConfirmationModal() {
  const confirm = useUiStore((state) => state.confirm);
  const resolveConfirm = useUiStore((state) => state.resolveConfirm);

  if (!confirm?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{confirm.title || 'Confirm action'}</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900">{confirm.message}</h2>
        </div>
        {confirm.description && (
          <p className="text-sm text-slate-600 mb-6">{confirm.description}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => resolveConfirm(false)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            {confirm.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => resolveConfirm(true)}
            className="w-full rounded-2xl bg-[#0c0f14] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#161b24] sm:w-auto"
          >
            {confirm.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
