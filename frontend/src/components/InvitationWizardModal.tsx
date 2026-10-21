import { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  Lock,
  Eye,
  Info,
} from 'lucide-react';
import {
  INVITATION_COLLECTIONS,
  CARD_TEMPLATES,
  type CardTemplate,
} from '../lib/invitationTemplates';
import type { Event, InvitationChannel, InvitationLetterDetails } from '../types';
import InvitationCardPreview from './InvitationCardPreview';
import { useInvitationStore } from '../store/invitationStore';
import { useUiStore } from '../store/uiStore';

interface InvitationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  selectedGuestIds: string[];
  totalGuestsCount: number;
  onInvitationsSent: () => void;
}

export default function InvitationWizardModal({
  isOpen,
  onClose,
  event,
  selectedGuestIds,
  totalGuestsCount,
  onInvitationsSent,
}: InvitationWizardModalProps) {
  const showToast = useUiStore((s) => s.showToast);
  const sendInvitations = useInvitationStore((s) => s.sendInvitations);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCollection, setSelectedCollection] = useState<string>('wedding-invitations');

  // Pre-fill event details
  const [details, setDetails] = useState<InvitationLetterDetails>({
    hostNames: event.name.replace(/wedding|ndoa|harusi/gi, '').trim() || 'Mariam & Amani',
    headline: event.type === 'WEDDING' ? 'The Wedding Celebration Of' : `Invitation to ${event.name}`,
    eventDate: event.eventDate || 'Saturday, 12th December 2026',
    ceremonyTime: event.startTime || '2:00 PM',
    receptionTime: '6:00 PM',
    venueName: event.venue || 'Mlimani City Conference Hall',
    venueAddress: 'Dar es Salaam, Tanzania',
    dressCode: 'Black Tie / Elegant Traditional',
    rsvpPhone: '+255 712 345 678',
    rsvpDeadline: '1st December 2026',
    personalMessage:
      'Together with our families, we joyfully invite you to share our happiness and celebrate this special milestone.',
    templateId: 'royal-botanical-gold',
    collectionType: 'wedding-invitations',
  });

  const [chosenTemplate, setChosenTemplate] = useState<CardTemplate>(CARD_TEMPLATES[0]);
  const [previewingTemplate, setPreviewingTemplate] = useState<CardTemplate | null>(null);
  const [channel, setChannel] = useState<InvitationChannel>('WHATSAPP');

  if (!isOpen) return null;

  const isWeddingEvent = event.type === 'WEDDING';
  const isOtherEvent = event.type === 'OTHER';

  const recipientCount = selectedGuestIds.length > 0 ? selectedGuestIds.length : totalGuestsCount;

  // Filter templates by selected collection
  const availableTemplates = CARD_TEMPLATES.filter((t) => {
    if (selectedCollection === 'wedding-related') {
      return t.collectionId === 'wedding-related';
    }
    return t.collectionId === 'wedding-invitations';
  });

  const handleNextFromCategory = (colId: string, comingSoon?: boolean) => {
    if (comingSoon) {
      showToast('This design collection is coming soon in the next update.', 'info');
      return;
    }
    setSelectedCollection(colId);
    setDetails((prev) => ({ ...prev, collectionType: colId }));
    setStep(2);
  };

  const handleChooseTemplateAndPreview = (tmpl: CardTemplate) => {
    setChosenTemplate(tmpl);
    setDetails((prev) => ({ ...prev, templateId: tmpl.id }));
    setPreviewingTemplate(tmpl);
  };

  const handleConfirmTemplate = () => {
    setPreviewingTemplate(null);
    setStep(4);
  };

  const handleSend = () => {
    const { sentCount } = sendInvitations(event.id, selectedGuestIds, channel, details);
    showToast(`Successfully dispatched ${sentCount} invitations via ${channel}!`, 'success');
    onInvitationsSent();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-line)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-line)] bg-[var(--color-surface)]">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--violet)]">
              Occassia v2.0 • Digital Invitation Suite
            </span>
            <h2 className="text-lg font-bold text-[var(--color-ink)]">
              {step === 1 && 'Step 1: Choose Invitation Collection'}
              {step === 2 && 'Step 2: Customize Letter & Event Details'}
              {step === 3 && 'Step 3: Select Your Luxury Card Design'}
              {step === 4 && 'Step 4: Dispatch Invitations'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-elevated)] transition"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="flex h-1 bg-[var(--color-line)]">
          <div
            className="bg-[var(--violet)] transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Collection Grid */}
          {step === 1 && (
            <div>
              <p className="text-sm text-[var(--color-ink-muted)] mb-6">
                Select an invitation theme. For weddings, explore our dedicated wedding suites and
                related celebrations.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                {INVITATION_COLLECTIONS.map((col) => {
                  const isLocked = !isOtherEvent && (isWeddingEvent ? !col.isAvailableForWedding : col.id !== event.type?.toLowerCase());
                  const isSelected = selectedCollection === col.id;

                  return (
                    <button
                      key={col.id}
                      onClick={() => handleNextFromCategory(col.id, isLocked || col.comingSoon)}
                      className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all text-left ${
                        isLocked
                          ? 'opacity-40 bg-[var(--color-surface)] border-[var(--color-line)] cursor-not-allowed'
                          : isSelected
                          ? 'border-[var(--violet)] bg-purple-500/10 shadow-md ring-2 ring-[var(--violet)]/20'
                          : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--violet)] hover:-translate-y-1'
                      }`}
                    >
                      {isLocked && (
                        <span className="absolute top-2 right-2 text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock size={10} /> Soon
                        </span>
                      )}
                      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-elevated)] shadow-sm flex items-center justify-center text-2xl mb-3">
                        {col.icon}
                      </div>
                      <h4 className="font-bold text-xs text-[var(--color-ink)] mb-1 leading-tight">
                        {col.name}
                      </h4>
                      <span className="text-[10px] text-[var(--violet)] font-semibold uppercase tracking-wider mt-auto pt-2">
                        {isLocked ? 'Coming Soon' : 'View Designs'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Pre-filled Details Form */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
                <Info size={16} className="shrink-0" />
                <span>
                  Details are pre-filled from your event setup. Wedding cards display ceremony and
                  reception times rather than an end date. Adjust any wording below.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">
                    Couple / Host Names *
                  </label>
                  <input
                    type="text"
                    value={details.hostNames}
                    onChange={(e) => setDetails({ ...details, hostNames: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. Mariam & Amani"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">
                    Invitation Headline
                  </label>
                  <input
                    type="text"
                    value={details.headline}
                    onChange={(e) => setDetails({ ...details, headline: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. The Wedding Celebration Of"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">Event Date *</label>
                  <input
                    type="text"
                    value={details.eventDate}
                    onChange={(e) => setDetails({ ...details, eventDate: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. Saturday, 12th December 2026"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">Ceremony Time</label>
                  <input
                    type="text"
                    value={details.ceremonyTime}
                    onChange={(e) => setDetails({ ...details, ceremonyTime: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. 2:00 PM"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">Reception & Dinner Time</label>
                  <input
                    type="text"
                    value={details.receptionTime}
                    onChange={(e) => setDetails({ ...details, receptionTime: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. 6:00 PM"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">Venue Name *</label>
                  <input
                    type="text"
                    value={details.venueName}
                    onChange={(e) => setDetails({ ...details, venueName: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. Serena Hotel Ballroom"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[var(--color-ink)] mb-1">Venue Address / City</label>
                  <input
                    type="text"
                    value={details.venueAddress}
                    onChange={(e) => setDetails({ ...details, venueAddress: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. Ohio Street, Dar es Salaam, Tanzania"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">Dress Code</label>
                  <input
                    type="text"
                    value={details.dressCode}
                    onChange={(e) => setDetails({ ...details, dressCode: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. Black Tie / Elegant Traditional"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">RSVP Contact Phone *</label>
                  <input
                    type="text"
                    value={details.rsvpPhone}
                    onChange={(e) => setDetails({ ...details, rsvpPhone: e.target.value })}
                    className="ops-input"
                    placeholder="+255 712 345 678"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--color-ink)] mb-1">RSVP Deadline</label>
                  <input
                    type="text"
                    value={details.rsvpDeadline}
                    onChange={(e) => setDetails({ ...details, rsvpDeadline: e.target.value })}
                    className="ops-input"
                    placeholder="e.g. 1st December 2026"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[var(--color-ink)] mb-1">Personal Note / Blessing to Guests</label>
                  <textarea
                    rows={2}
                    value={details.personalMessage}
                    onChange={(e) => setDetails({ ...details, personalMessage: e.target.value })}
                    className="ops-input py-2"
                    placeholder="Together with our families, we joyfully invite you to share our happiness..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Card Template Gallery */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--color-ink-muted)]">
                  Preview 10 luxury wedding & celebration designs rendered with your custom details.
                  Click any card to inspect full preview.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {availableTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleChooseTemplateAndPreview(tmpl)}
                    className="group relative cursor-pointer rounded-2xl p-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--violet)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="pointer-events-none scale-95 origin-top">
                      <InvitationCardPreview template={tmpl} details={details} compact={true} />
                    </div>
                    <div className="p-3 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[var(--color-ink)]">{tmpl.title}</h4>
                        <span className="text-[10px] text-[var(--violet)] font-bold flex items-center gap-1 group-hover:underline">
                          <Eye size={12} /> Preview
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-ink-muted)] line-clamp-1 mt-0.5">
                        {tmpl.subtitle}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Create Custom Design (Coming Soon) */}
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[var(--color-line)] bg-[var(--color-surface)] opacity-60 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-surface-elevated)] shadow-sm flex items-center justify-center text-xl mb-2">
                    🎨
                  </div>
                  <h4 className="font-bold text-xs text-[var(--color-ink)]">Add Custom Design</h4>
                  <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full mt-2 font-semibold">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Send & Dispatch Options */}
          {step === 4 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-ink)]">
                    Card Design Selected: {chosenTemplate.title}
                  </h4>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    Ready to send to {recipientCount} guest{recipientCount === 1 ? '' : 's'}. Each
                    guest receives a personalized 3D animated Bahasha invitation link.
                  </p>
                </div>
              </div>

              {/* Delivery Channel Picker */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)] mb-2 uppercase tracking-wider">
                  Select Delivery Channel *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setChannel('WHATSAPP')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                      channel === 'WHATSAPP'
                        ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-[var(--color-line)] bg-[var(--color-surface)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-ink)]">WhatsApp</div>
                      <div className="text-[10px] text-[var(--color-ink-muted)]">Hidden hyperlink</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setChannel('SMS')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                      channel === 'SMS'
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                        : 'border-[var(--color-line)] bg-[var(--color-surface)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-ink)]">Normal SMS</div>
                      <div className="text-[10px] text-[var(--color-ink-muted)]">+255 TZ carriers</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setChannel('EMAIL')}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                      channel === 'EMAIL'
                        ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
                        : 'border-[var(--color-line)] bg-[var(--color-surface)]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-ink)]">Email</div>
                      <div className="text-[10px] text-[var(--color-ink-muted)]">Branded HTML card</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Message Template Preview */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-ink)] mb-2 uppercase tracking-wider">
                  Invitation Message Preview
                </label>
                <div className="p-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] font-mono text-xs whitespace-pre-wrap leading-relaxed text-[var(--color-ink)]">
                  {channel === 'WHATSAPP' && (
                    <>
                      Habari <strong>[Guest Name]</strong>! You are cordially invited to celebrate{' '}
                      <strong>{details.headline}</strong> for{' '}
                      <strong>{details.hostNames}</strong>.
                      <br />
                      <br />
                      📅 Date: {details.eventDate}
                      <br />
                      📍 Venue: {details.venueName}
                      <br />
                      <br />
                      Please tap below to open your personalized 3D digital invitation and RSVP:
                      <br />
                      <span className="text-[var(--violet)] underline">
                        {window.location.origin}/invite/[unique-token]
                      </span>
                      <br />
                      <br />
                      We look forward to welcoming you! ✨
                    </>
                  )}

                  {channel === 'SMS' && (
                    <>
                      Habari [Guest Name], you are invited to {details.headline} ({details.hostNames})
                      on {details.eventDate}. Open your private invitation & RSVP: {window.location.origin}/invite/[unique-token]
                      {' '}- RSVP Info: {details.rsvpPhone}
                    </>
                  )}

                  {channel === 'EMAIL' && (
                    <>
                      Subject: Formal Invitation: {details.headline} - {details.hostNames}
                      <br />
                      <br />
                      Dear [Guest Name],
                      <br />
                      Together with our families, we invite you to celebrate with us.
                      <br />
                      <br />
                      [Open Digital Invitation Letter] → {window.location.origin}/invite/[unique-token]
                      <br />
                      RSVP Deadline: {details.rsvpDeadline}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-line)] bg-[var(--color-surface)]">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="ops-button secondary flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="ops-button primary flex items-center gap-2"
            >
              Select Card Designs <ArrowRight size={16} />
            </button>
          )}

          {step === 4 && (
            <button
              onClick={handleSend}
              className="ops-button primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send size={16} /> Dispatch {recipientCount} Invitations
            </button>
          )}
        </div>
      </div>

      {/* FULL CARD INSPECTOR PREVIEW OVERLAY */}
      {previewingTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
          <div className="relative w-full max-w-lg flex flex-col items-center">
            <button
              onClick={() => setPreviewingTemplate(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm bg-white/10 px-3 py-1 rounded-full"
            >
              <X size={16} /> Close Preview
            </button>

            <div className="w-full">
              <InvitationCardPreview template={previewingTemplate} details={details} />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setPreviewingTemplate(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition font-medium text-xs"
              >
                Choose Another Design
              </button>
              <button
                onClick={handleConfirmTemplate}
                className="px-6 py-2.5 rounded-xl bg-[var(--violet)] text-white hover:opacity-90 transition font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                <Check size={16} /> Use This Template & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
