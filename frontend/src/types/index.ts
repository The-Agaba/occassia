export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EVENT_MANAGER' | 'CHECKIN_STAFF' | 'VIEWER';
export type EventStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type EventType = 'WEDDING' | 'CONFERENCE' | 'BIRTHDAY' | 'OTHER';
export type AttendanceType = 'SINGLE' | 'PLUS_ONE';
export type CardStatus = 'AVAILABLE' | 'ASSIGNED' | 'CHECKED_IN' | 'LOST' | 'DAMAGED';
export type OrgStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  organizationId: string | null;
  fullName: string;
  email: string;
  role: UserRole;
  createdById?: string | null;
  creatorRole?: UserRole | null;
}

export interface Organization {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string | null;
  status: OrgStatus;
  createdAt: string;
}

export interface Event {
  id: string;
  organizationId: string;
  name: string;
  type: EventType;
  venue: string;
  eventDate: string;
  startDate?: string;
  endDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  status: EventStatus;
  createdBy: string;
  createdByName?: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  priorityLevel: number;
  colorHex: string;
}

export interface Guest {
  id: string;
  eventId: string;
  fullName: string;
  phoneNumber: string | null;
  attendanceType: AttendanceType;
  category: Category;
  nfcCardUid: string | null;
  qrToken: string;
  confirmed: boolean;
  paid: boolean;
  tableNumber: number | null;
  mealPreference: string | null;
  notes: string | null;
  checkedIn: boolean;
  createdAt: string;
}

export interface NfcCard {
  uid: string;
  organizationId: string;
  eventId: string | null;
  eventName?: string | null;
  organizationName?: string | null;
  status: CardStatus;
  assignedGuestId: string | null;
  assignedGuestName: string | null;
  registeredAt: string;
  assignedAt: string | null;
}

export interface Gate {
  id: string;
  name: string;
  location: string | null;
}

export interface CheckInResult {
  checkInId: string;
  guest: {
    id: string;
    fullName: string;
    attendanceType: AttendanceType;
    category: Category;
    tableNumber: number | null;
  };
  alreadyCheckedIn: boolean;
  checkedInAt: string;
}

export interface EventStats {
  totalGuests: number;
  checkedIn: number;
  remaining: number;
  byCategory: { name: string; colorHex: string; total: number; checkedIn: number }[];
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: Record<string, unknown> | null;
  userId: string | null;
  userName: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface ImportError {
  row: number;
  field?: string;
  reason: string;
  suggestion?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  skipped?: number;
  errors: ImportError[];
}

export type InvitationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';
export type InvitationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
export type RsvpStatus = 'PENDING' | 'ATTENDING' | 'DECLINED';

export interface InvitationLetterDetails {
  hostNames: string;
  headline: string;
  eventDate: string;
  eventTime?: string;
  ceremonyTime?: string;
  receptionTime?: string;
  venueName: string;
  venueAddress: string;
  dressCode?: string;
  rsvpPhone: string;
  rsvpDeadline?: string;
  personalMessage?: string;
  additionalNotes?: string;
  templateId: string;
  collectionType: string;
}

export interface InvitationRecord {
  id: string;
  guestId: string;
  eventId: string;
  token: string;
  guestName: string;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  categoryName?: string;
  tableNumber?: number | null;
  plusOnes: number;
  deliveryChannel?: InvitationChannel | null;
  deliveryStatus: InvitationStatus;
  deliveryError?: string | null;
  sentAt?: string | null;
  rsvpStatus: RsvpStatus;
  rsvpHeadcount: number;
  rsvpDietary?: string | null;
  rsvpMessage?: string | null;
  rsvpConfirmedAt?: string | null;
  invitationDetails: InvitationLetterDetails;
}
