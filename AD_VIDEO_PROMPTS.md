# Occassia Video Ad Prompt Pack

This document contains production-ready prompts for generating two short video advertisements for Occassia: a 30-second hero ad and a 15-second cutdown.

## Product truth and creative direction

Occassia is a web-based event access management platform for weddings, conferences, parties, corporate dinners, and other controlled-entry events. It helps teams manage guests, register and assign NFC cards, check guests in with NFC/QR/manual workflows, and monitor live event activity.

Use the following product truths in both videos:

- Occassia manages guests and event access from a web dashboard.
- Guest records can include confirmation, payment status, categories, attendance type, table number, meal preference, notes, and QR tokens.
- NFC cards are registered by UID and assigned to eligible confirmed and paid guests.
- NFC readers can integrate through HID/keyboard mode, Web NFC where supported, or a local serial bridge for custom readers.
- Check-in supports NFC, QR, and manual workflows.
- Staff can see live dashboard updates, gate activity, category breakdowns, and attendance information.
- The product uses JWT authentication, role-based access control, organization-level data isolation, and an audit log.
- Do not claim that Occassia processes payments, captures guest photos, guarantees fraud prevention, or supports every NFC card and reader without configuration.

## Global visual style

Use a premium, modern event-technology aesthetic: warm evening venue lighting, elegant wedding or event styling, subtle indigo and violet accents inspired by the Occassia interface, clean glass-and-white dashboard surfaces, realistic people, natural movement, and confident but calm operations.

The visual story should move from event-entry pressure to organized, effortless control. Show the system as polished and human-centered rather than cold or overly technical.

Use realistic UI-inspired overlays, but do not generate unreadable fake paragraphs or distorted interface text. Keep any visible UI labels short and exact: `Occassia`, `Guest Management`, `Register Card`, `Assign Card`, `Scan`, `Checked In`, `Live Dashboard`, `NFC`, `QR`, and `Manual Check-in`.

Avoid showing real names, phone numbers, email addresses, passwords, payment card data, JWT tokens, or identifiable guest data. Use fictional placeholder names only when text is necessary.

Recommended output: 16:9 master at 1920x1080, 24 or 30 fps, with safe margins for text. Also generate a 9:16 version for Reels, TikTok, and Shorts by keeping the people, device, card, and primary UI action centered. Use clean sans-serif typography and strong contrast.

## 30-second hero advertisement

### Generator prompt

```text
Create a polished 30-second product advertisement for “Occassia,” a web-based event access management platform for weddings and modern events.

Tone: elegant, reassuring, energetic, premium, human, operationally confident.
Audience: wedding planners, event managers, venue operators, guest-registration teams, and check-in staff.
Visual style: cinematic commercial realism, warm golden venue lighting, refined indigo and violet interface accents, smooth gimbal movement, shallow depth of field for human moments, crisp macro close-ups of NFC cards and scanners, clean dashboard overlays, natural facial expressions, believable event staff behavior.

Tell a complete story: an event team moves from stressful manual entry to a smooth, coordinated check-in experience powered by Occassia.

Do not show payment processing, face recognition, photo capture, QR codes being physically scanned incorrectly, fake unreadable UI paragraphs, random logos, batch-code fields, or a science-fiction hologram interface. Show one UID per NFC card scan and make every scanner interaction physically plausible.
```

### Shot-by-shot plan and narration

| Time | Visual direction | Voice-over | On-screen text |
|---|---|---|---|
| 0:00-0:03 | Establishing shot of a beautiful evening wedding or corporate event entrance. Guests arrive while two staff members prepare a check-in desk. The atmosphere is busy but tasteful. | “Every great event begins at the entrance.” | `OCCASSIA` |
| 0:03-0:07 | Close-up of a staff member viewing a clean Occassia dashboard on a laptop or tablet. Show short, legible cards such as `Guest Management`, `Confirmed`, and `Live Dashboard`. | “Occassia gives your team one clear view of every guest and every arrival.” | `Guest Management` |
| 0:07-0:11 | A staff member selects an eligible guest and assigns an NFC card. Show a small NFC card moving toward a compact reader; show a tasteful confirmation state: `Card Assigned`. | “Register NFC cards by UID, assign them to confirmed guests, and keep entry moving.” | `Register Card` → `Assign Card` |
| 0:11-0:15 | A guest presents the NFC card at the gate. The reader gives a subtle green confirmation light. Cut to the screen showing `Checked In`. Staff greet the guest with a smile. | “At the gate, a quick tap confirms the right guest in seconds.” | `NFC` · `Checked In` |
| 0:15-0:19 | Fast but clear montage: another guest presents a QR code on a phone, then a staff member completes a manual check-in for a guest who needs assistance. Keep all actions realistic. | “NFC, QR, or manual check-in—your team has the workflow that fits the moment.” | `NFC` · `QR` · `Manual Check-in` |
| 0:19-0:23 | Cut to the live operations dashboard. Animated counters update subtly; a gate activity feed and category breakdown refresh. Use abstract fictional data and no personal information. | “See live activity, attendance, and gate updates as the event unfolds.” | `Live Dashboard` |
| 0:23-0:27 | Show a calm event manager watching the dashboard while the entrance flows smoothly. Intercut with happy guests entering the venue. | “Less confusion at the door. More attention on the experience.” | `Stay in control` |
| 0:27-0:30 | Clean end card with Occassia wordmark, soft indigo gradient, and a simple event venue background. Hold long enough to read. | “Occassia. Manage guests. Assign cards. Check in with confidence.” | `Occassia` / `Manage guests. Assign cards. Check in with confidence.` |

### 30-second audio direction

Use an uplifting modern electronic-acoustic track: soft piano or warm plucks in the opening, subtle rhythmic pulse as check-in begins, and a confident musical lift on the final logo. Add restrained sound design: venue ambience, gentle card-reader beep, soft confirmation chime, and quiet interface taps. Keep the voice-over clear and in front of the music. Use a warm, trustworthy narrator with an even pace; do not sound rushed or exaggerated.

### 30-second end-card instruction

Hold the final end card for at least 2.5 seconds. Use the supplied Occassia logo if available. If no logo asset is supplied, render the word `Occassia` only in a clean modern sans-serif treatment with an indigo-to-violet accent. Do not invent a different company name or slogan.

## 15-second cutdown advertisement

### Generator prompt

```text
Create a concise, premium 15-second vertical-first product advertisement for “Occassia,” a web-based event access management platform.

Tone: fast, elegant, reassuring, organized, human.
Audience: event planners, venue teams, and check-in staff.
Show a clear before-and-after transformation: busy entrance, Occassia dashboard, NFC card scan, live confirmation, happy guests entering.

Use cinematic realism, warm event lighting, indigo and violet interface accents, centered compositions, readable short UI labels, and rapid but understandable cuts. Show one NFC UID scan, a green check-in confirmation, and a live dashboard update.

Do not show payment processing, face recognition, fake unreadable text, random branding, batch-code fields, or impossible scanner behavior. Do not imply that the serial bridge directly performs check-in; it is a local integration path for custom serial readers and card registration.
```

### Shot-by-shot plan and narration

| Time | Visual direction | Voice-over | On-screen text |
|---|---|---|---|
| 0:00-0:03 | Busy but elegant event entrance; staff organize the queue. | “Event entry should feel effortless.” | `The smarter way in` |
| 0:03-0:06 | Occassia dashboard on a tablet: guest list, categories, and a clean live status panel. | “Meet Occassia.” | `Occassia` |
| 0:06-0:10 | NFC card taps a reader; green confirmation appears; guest is welcomed through the gate. | “Register cards, check in guests, and keep the line moving.” | `NFC` → `Checked In` |
| 0:10-0:13 | Live dashboard updates while guests enter; quick flash of QR and manual check-in options. | “NFC, QR, or manual—stay in control.” | `Live Dashboard` |
| 0:13-0:15 | Indigo/violet end card with Occassia name and concise promise. | “Occassia. Events, in flow.” | `Occassia` / `Events, in flow.` |

### 15-second audio direction

Use a crisp modern beat with a single confirmation chime on the NFC scan. Start with subtle entrance ambience, raise the rhythm at the scan, and resolve with a clean brand sting. Use a short, confident voice-over with clear diction and no more than the supplied words.

## Optional social captions and call-to-action

Use one of these short captions without adding unsupported claims:

- “Manage guests. Assign NFC cards. Check in with confidence.”
- “A smoother guest experience starts at the door.”
- “From guest list to live check-in, keep every event in flow.”
- “NFC, QR, or manual check-in—one clear event workflow.”

Suggested CTA end text:

```text
Discover Occassia
Manage guests. Assign cards. Check in with confidence.
```

## Final quality checklist for the video generator

- [ ] Runtime is exactly 30 seconds or exactly 15 seconds.
- [ ] Occassia is spelled correctly every time.
- [ ] The interface text is short, readable, and not hallucinated.
- [ ] NFC cards are shown as physical cards or tags, not credit cards.
- [ ] The reader visibly interacts with the card before the confirmation state appears.
- [ ] Each card scan represents one UID.
- [ ] No batch-code field, fake payment screen, or personal data appears.
- [ ] The final logo/end card is held long enough to read.
- [ ] The 9:16 crop keeps the primary action centered and visible.
- [ ] The voice-over matches the written script exactly.
