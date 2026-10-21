import { create } from 'zustand';
import type { InvitationRecord, InvitationChannel, InvitationLetterDetails } from '../types';

interface InvitationState {
  invitationsByEvent: Record<string, InvitationRecord[]>;
  loadInvitations: (eventId: string, backendGuests?: any[], eventDetails?: any, backendInvitations?: any[]) => InvitationRecord[];
  importGuestsToInvitations: (eventId: string, newGuests: any[], eventDetails?: any) => InvitationRecord[];
  sendInvitations: (
    eventId: string,
    guestIds: string[],
    channel: InvitationChannel,
    details: InvitationLetterDetails
  ) => { sentCount: number; sampleMessage: string };
  submitRsvp: (
    token: string,
    rsvp: {
      status: 'ATTENDING' | 'DECLINED';
      headcount: number;
      dietary?: string;
      message?: string;
      phoneConfirm?: string;
    }
  ) => { success: boolean; invite?: InvitationRecord };
  getInvitationByToken: (token: string) => InvitationRecord | null;
}

const STORAGE_PREFIX = 'occassia_invitations_v2_';

function generateToken(): string {
  const rand = Math.random().toString(36).substring(2, 9);
  const time = Date.now().toString(36);
  return `occ-${rand}-${time}`;
}

export const useInvitationStore = create<InvitationState>((set, get) => ({
  invitationsByEvent: {},

  loadInvitations: (eventId: string, backendGuests = [], eventDetails, backendInvitations = []) => {
    const key = STORAGE_PREFIX + eventId;
    let existing: InvitationRecord[] = [];
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        existing = JSON.parse(saved);
      }
    } catch {
      existing = [];
    }

    const existingMap = new Map(existing.map((i) => [i.guestId, i]));
    const backendInvMap = new Map((backendInvitations || []).map((bi: any) => [bi.guestId, bi]));

    // Synchronize with backend guests
    const merged: InvitationRecord[] = [];

    // Add or merge backend guests
    for (const bg of backendGuests) {
      const match = existingMap.get(bg.id);
      const serverInv = backendInvMap.get(bg.id);

      if (match) {
        merged.push({
          ...match,
          token: serverInv?.token || match.token,
          guestName: bg.fullName || match.guestName,
          phoneNumber: bg.phoneNumber || match.phoneNumber,
          categoryName: bg.category?.name || match.categoryName,
          tableNumber: bg.tableNumber ?? match.tableNumber,
          rsvpStatus: serverInv?.rsvpStatus || match.rsvpStatus || (bg.confirmed ? 'ATTENDING' : 'PENDING'),
          rsvpHeadcount: serverInv?.rsvpHeadcount ?? match.rsvpHeadcount,
          deliveryChannel: serverInv?.deliveryChannel || match.deliveryChannel,
          deliveryStatus: serverInv?.deliveryStatus || match.deliveryStatus,
          invitationDetails: (serverInv?.letterDetails as any) || match.invitationDetails,
        });
        existingMap.delete(bg.id);
      } else {
        const token = serverInv?.token || generateToken();
        merged.push({
          id: serverInv?.id || 'inv-' + bg.id,
          guestId: bg.id,
          eventId,
          token,
          guestName: bg.fullName,
          phoneNumber: bg.phoneNumber,
          whatsappNumber: bg.phoneNumber,
          email: null,
          categoryName: bg.category?.name || 'General',
          tableNumber: bg.tableNumber || null,
          plusOnes: bg.attendanceType === 'PLUS_ONE' ? 1 : 0,
          deliveryChannel: serverInv?.deliveryChannel || null,
          deliveryStatus: serverInv?.deliveryStatus || 'PENDING',
          rsvpStatus: serverInv?.rsvpStatus || (bg.confirmed ? 'ATTENDING' : 'PENDING'),
          rsvpHeadcount: serverInv?.rsvpHeadcount || (bg.confirmed ? 1 : 0),
          invitationDetails: (serverInv?.letterDetails as any) || {
            hostNames: eventDetails?.name || 'Hosts',
            headline: 'Celebration Invitation',
            eventDate: eventDetails?.eventDate || 'Coming Soon',
            venueName: eventDetails?.venue || 'Venue',
            venueAddress: eventDetails?.venue || 'Dar es Salaam',
            rsvpPhone: '+255 700 000 000',
            templateId: serverInv?.templateId || 'royal-botanical-gold',
            collectionType: 'wedding-invitations',
            imageUrl: serverInv?.imageUrl,
          },
        });
      }
    }

    // Keep imported guests that might not be on backend yet
    for (const leftOver of existingMap.values()) {
      merged.push(leftOver);
    }

    try {
      localStorage.setItem(key, JSON.stringify(merged));
    } catch {
      // ignore
    }

    set((state) => ({
      invitationsByEvent: {
        ...state.invitationsByEvent,
        [eventId]: merged,
      },
    }));

    return merged;
  },

  importGuestsToInvitations: (eventId: string, newGuests = [], eventDetails) => {
    const current = get().invitationsByEvent[eventId] || get().loadInvitations(eventId, [], eventDetails);
    const existingNames = new Set(current.map((c) => c.guestName.toLowerCase().trim()));

    const additions: InvitationRecord[] = [];

    for (const g of newGuests) {
      const cleanName = (g.fullName || '').trim();
      if (!cleanName || existingNames.has(cleanName.toLowerCase())) continue;

      const guestId = 'guest-' + Math.random().toString(36).slice(2, 10);
      const token = generateToken();

      additions.push({
        id: 'inv-' + guestId,
        guestId,
        eventId,
        token,
        guestName: cleanName,
        phoneNumber: g.phoneNumber || null,
        whatsappNumber: g.whatsappNumber || g.phoneNumber || null,
        email: g.email || null,
        categoryName: g.categoryName || 'General',
        tableNumber: g.tableNumber || null,
        plusOnes: g.plusOnes || 0,
        deliveryChannel: null,
        deliveryStatus: 'PENDING',
        rsvpStatus: 'PENDING',
        rsvpHeadcount: 0,
        notes: g.notes || null,
        invitationDetails: {
          hostNames: eventDetails?.name || 'Occassia Hosts',
          headline: 'Celebration Invitation',
          eventDate: eventDetails?.eventDate || 'Upcoming',
          venueName: eventDetails?.venue || 'Venue',
          venueAddress: eventDetails?.venue || 'Dar es Salaam',
          rsvpPhone: '+255 700 000 000',
          templateId: 'royal-botanical-gold',
          collectionType: 'wedding-invitations',
        },
      } as any);
      existingNames.add(cleanName.toLowerCase());
    }

    const updated = [...current, ...additions];
    try {
      localStorage.setItem(STORAGE_PREFIX + eventId, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set((state) => ({
      invitationsByEvent: {
        ...state.invitationsByEvent,
        [eventId]: updated,
      },
    }));

    return updated;
  },

  sendInvitations: (eventId, guestIds, channel, details) => {
    const current = get().invitationsByEvent[eventId] || [];
    const targetSet = new Set(guestIds);
    let sentCount = 0;

    const now = new Date().toISOString();

    const updated = current.map((item) => {
      if (targetSet.has(item.id) || targetSet.has(item.guestId)) {
        sentCount++;
        return {
          ...item,
          deliveryChannel: channel,
          deliveryStatus: 'DELIVERED' as const,
          sentAt: now,
          invitationDetails: details,
        };
      }
      return item;
    });

    try {
      localStorage.setItem(STORAGE_PREFIX + eventId, JSON.stringify(updated));
    } catch {
      // ignore
    }

    set((state) => ({
      invitationsByEvent: {
        ...state.invitationsByEvent,
        [eventId]: updated,
      },
    }));

    const sampleGuest = updated.find((u) => targetSet.has(u.id) || targetSet.has(u.guestId));
    const token = sampleGuest?.token || 'sample-token';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://occassia.com';
    const inviteUrl = `${origin}/invite/${token}`;

    let sampleMessage = '';
    if (channel === 'WHATSAPP') {
      sampleMessage = `Habari ${sampleGuest?.guestName || 'Mgeni wetu'}, you are cordially invited to ${details.headline} celebrating ${details.hostNames}.\n\n📅 Date: ${details.eventDate}\n📍 Venue: ${details.venueName}\n\nPlease click below to view your personalized digital invitation and RSVP:\n${inviteUrl}\n\nWe look forward to celebrating with you! ✨`;
    } else if (channel === 'SMS') {
      sampleMessage = `Habari ${sampleGuest?.guestName || 'Mgeni'}, you're invited to ${details.headline} (${details.hostNames}) on ${details.eventDate}. Open private invite & RSVP: ${inviteUrl} - RSVP info: ${details.rsvpPhone}`;
    } else {
      sampleMessage = `Subject: Formal Invitation: ${details.headline} - ${details.hostNames}\n\nDear ${sampleGuest?.guestName || 'Honored Guest'},\nTogether with our families, we invite you to celebrate with us.\n\nOpen your digital invitation letter: ${inviteUrl}\n\nRSVP Deadline: ${details.rsvpDeadline || 'Soon'}`;
    }

    return { sentCount, sampleMessage };
  },

  submitRsvp: (token, rsvp) => {
    // Search across all event storage keys
    let foundEventId: string | null = null;
    let foundIndex = -1;
    let list: InvitationRecord[] = [];

    // Check memory first
    for (const [eId, items] of Object.entries(get().invitationsByEvent)) {
      const idx = items.findIndex((i) => i.token === token);
      if (idx !== -1) {
        foundEventId = eId;
        foundIndex = idx;
        list = items;
        break;
      }
    }

    // Check local storage if not in memory
    if (!foundEventId) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '[]');
            const idx = parsed.findIndex((item: any) => item.token === token);
            if (idx !== -1) {
              foundEventId = k.replace(STORAGE_PREFIX, '');
              foundIndex = idx;
              list = parsed;
              break;
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (!foundEventId || foundIndex === -1) {
      return { success: false };
    }

    const updatedItem: InvitationRecord = {
      ...list[foundIndex],
      rsvpStatus: rsvp.status,
      rsvpHeadcount: rsvp.status === 'ATTENDING' ? rsvp.headcount : 0,
      rsvpDietary: rsvp.dietary || null,
      rsvpMessage: rsvp.message || null,
      rsvpConfirmedAt: new Date().toISOString(),
      phoneNumber: rsvp.phoneConfirm || list[foundIndex].phoneNumber,
    };

    const updatedList = [...list];
    updatedList[foundIndex] = updatedItem;

    try {
      localStorage.setItem(STORAGE_PREFIX + foundEventId, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    set((state) => ({
      invitationsByEvent: {
        ...state.invitationsByEvent,
        [foundEventId!]: updatedList,
      },
    }));

    // Trigger PWA notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('Occassia RSVP Received! 💌', {
            body: `${updatedItem.guestName} has ${rsvp.status === 'ATTENDING' ? 'confirmed attendance' : 'declined'}. Headcount: ${updatedItem.rsvpHeadcount}`,
            icon: '/new-favicon.svg',
          });
        } catch {
          // ignore notification error
        }
      }
    }

    return { success: true, invite: updatedItem };
  },

  getInvitationByToken: (token: string) => {
    // Check in-memory store
    for (const items of Object.values(get().invitationsByEvent)) {
      const match = items.find((i) => i.token === token);
      if (match) return match;
    }

    // Search local storage
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '[]');
            const match = parsed.find((item: any) => item.token === token);
            if (match) return match;
          } catch {
            // ignore
          }
        }
      }
    }

    return null;
  },
}));
