import api from '../lib/axios';
import type { User, Event, Category, Guest, NfcCard, Gate, CheckInResult, EventStats, AuditEntry, Organization } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    // Free-tier hosts can take several minutes to wake. Login gets a generous
    // timeout without slowing down normal API requests elsewhere in the app.
    api.post<{ token: string; refreshToken: string; user: User }>('/auth/login', { email, password }, { timeout: 300000 }),
  me: () => api.get<User>('/auth/me'),
  /** Update own profile (name, email, password). Cannot change role. */
  updateMe: (data: { fullName?: string; email?: string; password?: string }) =>
    api.put<User>('/auth/me', data),
  logout: () => api.post('/auth/logout'),
};

export const publicApi = {
  metrics: () => api.get<{ totalCheckIns: number }>('/public/metrics'),
};

export const eventsApi = {
  list: () => api.get<Event[]>('/events'),
  get: (id: string) => api.get<Event>(`/events/${id}`),
  create: (data: Partial<Event>) => api.post<Event>('/events', data),
  update: (id: string, data: Partial<Event>) => api.put<Event>(`/events/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch<Event>(`/events/${id}/status`, { status }),
  stats: (id: string) => api.get<EventStats>(`/events/${id}/stats`),
};

export const categoriesApi = {
  list: (eventId: string) => api.get<Category[]>(`/events/${eventId}/categories`),
  create: (eventId: string, data: Partial<Category>) =>
    api.post<Category>(`/events/${eventId}/categories`, data),
};

export const gatesApi = {
  list: (eventId: string) => api.get<Gate[]>(`/events/${eventId}/gates`),
  create: (eventId: string, data: Partial<Gate>) => api.post<Gate>(`/events/${eventId}/gates`, data),
};

export const guestsApi = {
  list: (eventId: string, params?: Record<string, string>) =>
    api.get<Guest[]>(`/events/${eventId}/guests`, { params }),
  assignable: (eventId: string) => api.get<Guest[]>(`/events/${eventId}/guests/assignable`),
  create: (eventId: string, data: Record<string, unknown>) =>
    api.post<Guest>(`/events/${eventId}/guests`, data),
  update: (eventId: string, guestId: string, data: Record<string, unknown>) =>
    api.put<Guest>(`/events/${eventId}/guests/${guestId}`, data),
  delete: (eventId: string, guestId: string) => api.delete(`/events/${eventId}/guests/${guestId}`),
  confirm: (guestId: string) => api.patch<Guest>(`/guests/${guestId}/confirm`),
  paid: (guestId: string) => api.patch<Guest>(`/guests/${guestId}/paid`),
  import: (eventId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/events/${eventId}/guests/batch`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  qrUrl: (guestId: string) => `/api/v1/guests/${guestId}/qr`,
  qrBlob: (guestId: string) => api.get(`/guests/${guestId}/qr`, { responseType: 'blob' }),
};

export const cardsApi = {
  list: (status?: string) => api.get<NfcCard[]>('/cards', { params: status ? { status } : {} }),
  register: (uid: string) => api.post<NfcCard>('/cards', { uid }),
  batch: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/cards/batch', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  assign: (guestId: string, nfcUid: string) =>
    api.patch(`/guests/${guestId}/assign-card`, { nfcUid }),
  unassign: (guestId: string) => api.patch(`/guests/${guestId}/unassign-card`),
  updateStatus: (uid: string, status: string) => api.patch(`/cards/${uid}/status`, { status }),
};

export const checkinApi = {
  nfc: (nfcUid: string, gateId?: string) =>
    api.post<CheckInResult>('/checkin/nfc', { nfcUid, gateId }),
  qr: (qrToken: string, gateId?: string) =>
    api.post<CheckInResult>('/checkin/qr', { qrToken, gateId }),
  print: (checkInId: string) => api.patch(`/checkin/${checkInId}/print`),
  list: (eventId: string) => api.get<CheckInResult[]>(`/events/${eventId}/checkins`),
};

export const reportsApi = {
  export: (eventId: string) =>
    api.get(`/events/${eventId}/reports/export`, { responseType: 'blob' }),
};

export const usersApi = {
  list: () => api.get('/users'),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const auditApi = {
  org: () => api.get<AuditEntry[]>('/audit'),
  event: (eventId: string) => api.get<AuditEntry[]>(`/events/${eventId}/audit`),
};

export const organizationsApi = {
  list: () => api.get<Organization[]>('/organizations'),
  get: (id: string) => api.get<Organization>(`/organizations/${id}`),
  create: (data: { name: string; contactEmail: string; contactPhone?: string }) =>
    api.post<Organization>('/organizations', data),
  update: (id: string, data: { name: string; contactEmail: string; contactPhone?: string }) =>
    api.put<Organization>(`/organizations/${id}`, data),
  deactivate: (id: string) => api.patch<Organization>(`/organizations/${id}/status`, { status: 'INACTIVE' }),
  activate: (id: string) => api.patch<Organization>(`/organizations/${id}/status`, { status: 'ACTIVE' }),
};
