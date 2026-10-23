import axios from 'axios';

const TECHNICAL_PATTERN =
  /minified react error|react\.dev\/errors|typeerror|referenceerror|syntaxerror|rangeerror|cannot read propert|is not a function|is not defined|is not iterable|undefined|\bnull\b|exception|stack ?trace|\bat [\w.$]+\(|java\.|org\.springframework|com\.occassia|hibernate|jdbc|sql|constraint|nullpointer|unexpected token|json|\.js:\d+|\.tsx?:\d+/i;

/** True when text looks like a developer-facing error rather than something an end user should read. */
export function isTechnicalMessage(text: unknown): boolean {
  if (typeof text !== 'string') return true;
  const trimmed = text.trim();
  return trimmed.length === 0 || trimmed.length > 220 || TECHNICAL_PATTERN.test(trimmed);
}

/** Returns the message only if it is safe to show to users, otherwise the fallback. */
export function safeUserMessage(text: unknown, fallback: string): string {
  return isTechnicalMessage(text) ? fallback : (text as string);
}

export function apiErrorMessage(error: unknown, fallback = 'The request could not be completed.') {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      console.error('[Error]', error);
      return safeUserMessage(error.message, fallback);
    }
    return fallback;
  }

  if (error.code === 'ERR_CANCELED') {
    return 'The request was canceled before it finished.';
  }

  // Network / Connection level errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'The server took too long to respond. Please try again.';
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'No internet connection. Please check your network and try again.';
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to connect to the server. It may be starting up or temporarily offline.';
    }
    if (error.request) {
      return 'The server did not send a response. Please try again shortly.';
    }
    return 'The connection could not be established. Please check your network.';
  }

  const status = error.response.status;
  const payload = error.response.data as any;
  const rawServerMsg = typeof payload === 'object' && payload !== null ? payload.message : undefined;
  const serverMsg = isTechnicalMessage(rawServerMsg) ? undefined : (rawServerMsg as string);

  // HTTP status handling
  if (status >= 300 && status < 400) {
    return 'The request encountered a redirection loop or moved endpoint. Please refresh the page.';
  }
  if (status === 400 || status === 422) {
    if (payload?.fields && typeof payload.fields === 'object') {
      const fieldList = Object.entries(payload.fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return `Validation failed: ${fieldList}`;
    }
    return serverMsg || 'The submitted data is invalid. Please check the form and try again.';
  }
  if (status === 401) {
    return 'Your session has expired. Please sign in again to continue.';
  }
  if (status === 403) {
    return serverMsg || 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return serverMsg || 'The requested resource could not be found. It may have been removed or moved.';
  }
  if (status === 408) {
    return 'The request timed out while processing. Please try again.';
  }
  if (status === 409) {
    return serverMsg || 'This action conflicts with the current record state. Refresh and try again.';
  }
  if (status === 413) {
    return serverMsg || 'The uploaded file or image exceeds the maximum allowed size (10MB). Please choose a smaller file.';
  }
  if (status === 429) {
    return 'Too many requests sent in a short time. Please wait a moment and try again.';
  }
  if (status === 502 || status === 503 || status === 504) {
    return 'The server is temporarily unavailable or restarting. Please wait a few seconds and try again.';
  }
  if (status >= 500) {
    return 'A server error occurred. Our team has been notified. Please try again shortly.';
  }

  return serverMsg || (isTechnicalMessage(fallback) ? 'Something went wrong. Please try again.' : fallback);
}
