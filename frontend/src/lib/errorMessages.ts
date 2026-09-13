import axios from 'axios';

export function apiErrorMessage(error: unknown, fallback = 'The request could not be completed.') {
  if (!axios.isAxiosError(error)) return fallback;
  if (error.code === 'ERR_CANCELED') return 'The request was canceled before it finished.';
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return 'The server took too long to respond. Please try again.';
    if (!navigator.onLine) return 'No internet connection. Check your network and try again.';
    if (error.code === 'ERR_NETWORK') return 'The server could not be reached. It may be restarting or temporarily unavailable.';
    if (error.request) return 'The server did not send a response. Please try again shortly.';
    return 'The connection could not be established. Please try again shortly.';
  }
  const status = error.response.status;
  const payload = error.response.data as any;
  if (status === 408) return 'The server timed out while processing the request. Please try again.';
  if (status === 400 || status === 422) return payload?.message === 'Validation failed' ? 'Some submitted values are invalid. Check the highlighted fields and try again.' : payload?.message || 'The submitted data is invalid. Check the form and try again.';
  if (status === 401) return 'Your session has expired. Sign in again to continue.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return payload?.message || 'The requested record could not be found. It may have been removed.';
  if (status === 409) return payload?.message || 'This action conflicts with the current record state. Refresh and try again.';
  if (status === 429) return 'Too many requests. Wait a moment and try again.';
  if (status === 502 || status === 503 || status === 504) return 'The server is temporarily unavailable or waking up. Please try again shortly.';
  if (status >= 500) return payload?.message || 'The server encountered a problem. Please try again shortly.';
  return payload?.message || fallback;
}
