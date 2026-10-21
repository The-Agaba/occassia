import * as XLSX from 'xlsx';
import type { InvitationRecord } from '../types';

/**
 * Standardize Tanzanian phone numbers into canonical E.164 format (+255...).
 * Accepts 07XXXXXXXX, 06XXXXXXXX, 255XXXXXXXXX, +255XXXXXXXXX, etc.
 */
export function standardizeTanzaniaPhone(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  let str = String(raw).trim().replace(/[\s\-().]/g, '');
  if (!str) return null;

  // e.g. 0712345678 or 0685112233 (10 digits starting with 0)
  if (str.startsWith('0') && str.length === 10) {
    return '+255' + str.slice(1);
  }

  // e.g. 255712345678 (12 digits starting with 255)
  if (str.startsWith('255') && str.length === 12) {
    return '+' + str;
  }

  // e.g. +255712345678 (13 digits starting with +255)
  if (str.startsWith('+255') && str.length === 13) {
    return str;
  }

  // e.g. 712345678 or 685112233 (9 digits)
  if (str.length === 9 && (str.startsWith('7') || str.startsWith('6'))) {
    return '+255' + str;
  }

  // Fallback cleanup
  if (/^\+?\d{9,15}$/.test(str)) {
    return str.startsWith('+') ? str : '+' + str;
  }

  return str;
}

/**
 * Standardize and sanitize emails
 */
export function standardizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const str = String(raw).trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return str;
  }
  return null;
}

export interface ParsedInvitationRow {
  fullName: string;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  email: string | null;
  categoryName: string;
  plusOnes: number;
  tableNumber: number | null;
  notes: string | null;
  isValid: boolean;
  error?: string;
}

/**
 * Generates and downloads the official Occassia Excel (.xlsx) Template for Event Invitations
 */
export function downloadInvitationTemplate(eventName: string = 'Occassia Event') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Guest List Data
  const headers = [
    'Full Name *',
    'Phone / SMS Number *',
    'WhatsApp Number (Optional)',
    'Email Address (Optional)',
    'Guest Category / Tier',
    'Plus Ones Allowed',
    'Table Number',
    'Notes / Special Requests'
  ];

  const sampleData = [
    [
      'Juma Bakari',
      '0712345678',
      '0712345678',
      'juma.bakari@gmail.com',
      'VIP',
      1,
      1,
      'Vegetarian meal requested'
    ],
    [
      'Neema Mwangi',
      '0754987654',
      '0754987654',
      'neema.mwangi@gmail.com',
      'Family',
      2,
      2,
      'Bridal family'
    ],
    [
      'Baraka Msuya',
      '0685112233',
      '',
      'baraka.msuya@yahoo.com',
      'Regular',
      0,
      5,
      ''
    ],
    [
      'Rehema Salum',
      '0767001122',
      '0767001122',
      '',
      'Bridal Party',
      1,
      3,
      'Halal meal'
    ],
    [
      'Dennis Kiwanga',
      '+255784998877',
      '+255784998877',
      'dennis@cotronix.com',
      'VIP',
      1,
      1,
      'Special guest'
    ]
  ];

  const wsData = [headers, ...sampleData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 22 }, // Full Name
    { wch: 22 }, // Phone
    { wch: 26 }, // WhatsApp
    { wch: 28 }, // Email
    { wch: 22 }, // Category
    { wch: 18 }, // Plus ones
    { wch: 14 }, // Table
    { wch: 32 }  // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Guest List');

  // Sheet 2: Guidelines
  const guideData = [
    ['OCCASSIA v2.0 - INVITATION & GUEST IMPORT GUIDELINES'],
    [''],
    ['Field', 'Required?', 'Format / Accepted Values', 'Notes'],
    ['Full Name', 'Yes', 'Text (e.g. Juma Bakari)', 'Appears on the digital invitation envelope and card'],
    ['Phone / SMS Number', 'Recommended', '07XXXXXXXX, 06XXXXXXXX, or +255XXXXXXXXX', 'Auto-converted to +255 canonical format for SMS invitations'],
    ['WhatsApp Number', 'Optional', '07XXXXXXXX, 06XXXXXXXX, or +255XXXXXXXXX', 'Used for direct WhatsApp Business digital invitation links'],
    ['Email Address', 'Optional', 'valid.email@example.com', 'Used for digital invitation email delivery'],
    ['Guest Category / Tier', 'Optional', 'VIP, Family, Regular, Bridal Party, etc.', 'Groups guests and controls seating/access priority'],
    ['Plus Ones Allowed', 'Optional', '0, 1, 2, 3...', 'Limits number of guests that can RSVP on this invite (Default 0)'],
    ['Table Number', 'Optional', 'Number (e.g. 1, 2, 10)', 'Table assigned at reception / gate'],
    ['Notes / Special Requests', 'Optional', 'Text (Dietary, VIP, etc.)', 'Displayed to event coordinators and gate team'],
    [''],
    ['Tanzania Phone Standardization:', 'All Tanzanian numbers (07xx, 06xx) are automatically formatted to +255 for reliable carrier delivery.'],
    ['Confidentiality:', 'Guest data is strictly used for event management and private digital invitations under Occassia terms.']
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 42 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Guidelines');

  const safeEventName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Occassia_Invitation_Template_${safeEventName}.xlsx`);
}

/**
 * Parses an uploaded .xlsx or .xls file into standardized invitation records
 */
export async function parseInvitationExcel(file: File): Promise<ParsedInvitationRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  if (!ws) return [];

  const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (rawRows.length < 2) return [];

  const headerRow: string[] = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
  
  // Find column indexes flexibly
  const findCol = (...names: string[]) => {
    return headerRow.findIndex(h => names.some(name => h.includes(name)));
  };

  const nameCol = findCol('full name', 'name', 'jina');
  const phoneCol = findCol('phone', 'sms', 'simu', 'mobile');
  const whatsappCol = findCol('whatsapp', 'wa');
  const emailCol = findCol('email', 'barua pepe');
  const catCol = findCol('category', 'tier', 'aina', 'group');
  const plusCol = findCol('plus one', 'plus_one', 'companions', 'headcount');
  const tableCol = findCol('table', 'meza');
  const notesCol = findCol('note', 'diet', 'request', 'maoni');

  const results: ParsedInvitationRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const rawName = nameCol >= 0 ? row[nameCol] : row[0];
    const fullName = String(rawName || '').trim();
    if (!fullName) continue;

    const rawPhone = phoneCol >= 0 ? row[phoneCol] : null;
    const rawWa = whatsappCol >= 0 ? row[whatsappCol] : null;
    const rawEmail = emailCol >= 0 ? row[emailCol] : null;
    const rawCat = catCol >= 0 ? row[catCol] : null;
    const rawPlus = plusCol >= 0 ? row[plusCol] : 0;
    const rawTable = tableCol >= 0 ? row[tableCol] : null;
    const rawNotes = notesCol >= 0 ? row[notesCol] : null;

    const phoneNumber = standardizeTanzaniaPhone(rawPhone);
    const whatsappNumber = standardizeTanzaniaPhone(rawWa) || phoneNumber;
    const email = standardizeEmail(rawEmail);
    const categoryName = String(rawCat || 'General').trim() || 'General';
    const plusOnes = Math.max(0, parseInt(String(rawPlus || '0'), 10) || 0);
    const tableNumber = rawTable ? parseInt(String(rawTable), 10) || null : null;
    const notes = rawNotes ? String(rawNotes).trim() : null;

    results.push({
      fullName,
      phoneNumber,
      whatsappNumber,
      email,
      categoryName,
      plusOnes,
      tableNumber,
      notes,
      isValid: true
    });
  }

  return results;
}

/**
 * Exports confirmed guests in an elegant XLSX spreadsheet
 */
export function exportConfirmedGuestsXlsx(invites: InvitationRecord[], eventName: string) {
  const confirmed = invites.filter(i => i.rsvpStatus === 'ATTENDING');
  const headers = [
    'Guest Name',
    'Category / Tier',
    'Confirmed Headcount',
    'Phone Number',
    'WhatsApp Number',
    'Email',
    'Table Assigned',
    'Dietary Preferences / Notes',
    'RSVP Message to Hosts',
    'Confirmed At'
  ];

  const rows = confirmed.map(c => [
    c.guestName,
    c.categoryName || 'General',
    1 + (c.rsvpHeadcount || 0),
    c.phoneNumber || 'N/A',
    c.whatsappNumber || 'N/A',
    c.email || 'N/A',
    c.tableNumber || 'Unassigned',
    c.rsvpDietary || 'None',
    c.rsvpMessage || '',
    c.rsvpConfirmedAt ? new Date(c.rsvpConfirmedAt).toLocaleString() : 'Yes'
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 24 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 30 },
    { wch: 36 },
    { wch: 22 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Confirmed RSVPs');
  const safeName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `${safeName}_Confirmed_Guests_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exports complete invitation delivery and dispatch reports
 */
export function exportDeliveryReportsXlsx(invites: InvitationRecord[], eventName: string) {
  const headers = [
    'Guest Name',
    'Delivery Channel',
    'Delivery Status',
    'Target Phone / Email',
    'Sent At',
    'RSVP Status',
    'Unique Token / Link',
    'System Notes'
  ];

  const rows = invites.map(i => [
    i.guestName,
    i.deliveryChannel || 'Pending Dispatch',
    i.deliveryStatus,
    i.deliveryChannel === 'EMAIL' ? i.email : i.deliveryChannel === 'WHATSAPP' ? i.whatsappNumber : i.phoneNumber || 'N/A',
    i.sentAt ? new Date(i.sentAt).toLocaleString() : 'Not yet sent',
    i.rsvpStatus,
    `${window.location.origin}/invite/${i.token}`,
    i.deliveryError || 'OK'
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 42 },
    { wch: 26 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Delivery Reports');
  const safeName = eventName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `${safeName}_Delivery_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
