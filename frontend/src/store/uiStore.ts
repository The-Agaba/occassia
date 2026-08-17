import { create } from 'zustand';

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' };

type ConfirmPayload = {
  open: boolean;
  title?: string;
  message: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type UiState = {
  loading: boolean;
  toasts: Toast[];
  confirm: ConfirmPayload | null;
  setLoading: (v: boolean) => void;
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  confirmAction: (payload: Omit<ConfirmPayload, 'open'>) => Promise<boolean>;
  resolveConfirm: (value: boolean) => void;
};

let confirmResolver: ((value: boolean) => void) | null = null;

export const useUiStore = create<UiState>((set) => ({
  loading: false,
  toasts: [],
  confirm: null,
  setLoading: (v) => set({ loading: v }),
  showToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        {
          id: String(Date.now()) + Math.random().toString(36).slice(2),
          message,
          type,
        },
      ],
    })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  confirmAction: (payload) =>
    new Promise((resolve) => {
      confirmResolver = resolve;
      set({
        confirm: {
          open: true,
          title: payload.title,
          message: payload.message,
          description: payload.description,
          confirmLabel: payload.confirmLabel,
          cancelLabel: payload.cancelLabel,
        },
      });
    }),
  resolveConfirm: (value) => {
    set({ confirm: null });
    if (confirmResolver) {
      confirmResolver(value);
      confirmResolver = null;
    }
  },
}));

export default useUiStore;
