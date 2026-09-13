import axios from 'axios';

export function apiErrorMessage(error: unknown, fallback = 'The request could not be completed.') {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) {
    if (!navigator.onLine || error.code === 'ERR_NETWORK') return 'No internet connection. Check your network and try again.';
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'The server took too long to respond. Please try again.';
    return 'The API is unavailable right now. Please try again shortly.';
  }
  const status = error.response.status;
  const payload = error.response.data as any;
  if (status === 400 || status === 422) return payload?.message === 'Validation failed' ? 'Some submitted values are invalid. Check the highlighted fields and try again.' : payload?.message || 'The submitted data is invalid. Check the form and try again.';
  if (status === 401) return 'Your session has expired. Sign in again to continue.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return payload?.message || 'The requested record could not be found. It may have been removed.';
  if (status === 409) return payload?.message || 'This action conflicts with the current record state. Refresh and try again.';
  if (status === 429) return 'Too many requests. Wait a moment and try again.';
  if (status >= 500) return payload?.message || 'The server is temporarily unavailable. Try again shortly.';
  return payload?.message || fallback;
}
