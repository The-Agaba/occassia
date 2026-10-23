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
  Camera,
  UploadCloud,
  Sparkles,
  Loader2,
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
import { invitationsApi } from '../api';
import { apiErrorMessage } from '../lib/errorMessages';

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
  const [details, setDetails] = useState<InvitationLetterDetails>(() => {
    const rawName = event?.name || '';
    const hostNames = rawName.replace(/wedding|ndoa|harusi/gi, '').trim() || 'Mariam & Amani';
    const headline = event?.type === 'WEDDING' ? 'The Wedding Celebration Of' : `Invitation to ${rawName || 'the Event'}`;
    return {
      hostNames,
      headline,
      eventDate: event?.eventDate || 'Saturday, 12th December 2026',
      ceremonyTime: event?.startTime || '2:00 PM',
      receptionTime: '6:00 PM',
      venueName: event?.venue || 'Mlimani City Conference Hall',
      venueAddress: 'Dar es Salaam, Tanzania',
      dressCode: 'Black Tie / Elegant Traditional',
      rsvpPhone: '+255 712 345 678',
      rsvpDeadline: '1st December 2026',
      personalMessage:
        'Together with our families, we joyfully invite you to share our happiness and celebrate this special milestone.',
      templateId: 'royal-botanical-gold',
      collectionType: 'wedding-invitations',
    };
  });

  const [chosenTemplate, setChosenTemplate] = useState<CardTemplate>(CARD_TEMPLATES[0]);
  const [previewingTemplate, setPreviewingTemplate] = useState<CardTemplate | null>(null);
  const [channel, setChannel] = useState<InvitationChannel>('WHATSAPP');

  // Photo template prompt state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoPendingTemplate, setPhotoPendingTemplate] = useState<CardTemplate | null>(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string>(details.imageUrl || '');

  const PHOTO_PRESETS = [
    { label: 'Golden Hour Couple', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80' },
    { label: 'Modern Arch Romance', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80' },
    { label: 'Celebration Send-Off', url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80' },
    { label: 'Minimalist Studio', url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80' },
  ];

  if (!isOpen) return null;

  const isWeddingEvent = event.type === 'WEDDING';
  const isOtherEvent = event.type === 'OTHER';

  const recipientCount = selectedGuestIds.length > 0 ? selectedGuestIds.length : totalGuestsCount;

  // Filter templates by selected collection with fallback
  const collectionTemplates = CARD_TEMPLATES.filter((t) => t.collectionId === selectedCollection);
  const availableTemplates = collectionTemplates.length > 0
    ? collectionTemplates
    : CARD_TEMPLATES.filter((t) => t.collectionId === 'wedding-invitations');

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

    // If template holds images and user has not added one yet, prompt them to add image
    if (tmpl.supportsImage && !details.imageUrl) {
      setPhotoPendingTemplate(tmpl);
      setTempPhotoUrl(tmpl.defaultImage || '');
      setPhotoModalOpen(true);
    } else {
      setPreviewingTemplate(tmpl);
    }
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Photo exceeds 8MB limit. Please upload a smaller file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTempPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPhoto = () => {
    const finalUrl = tempPhotoUrl || photoPendingTemplate?.defaultImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
    setDetails((prev) => ({ ...prev, imageUrl: finalUrl }));
    setPhotoModalOpen(false);
    if (photoPendingTemplate) {
      setPreviewingTemplate(photoPendingTemplate);
      setPhotoPendingTemplate(null);
    }
    showToast('Photo successfully attached to invitation card!', 'success');
  };

  const handleConfirmTemplate = () => {
    setPreviewingTemplate(null);
    setStep(4);
  };

  const [isDispatching, setIsDispatching] = useState(false);

  const handleSend = async () => {
    setIsDispatching(true);
    try {
      const isUuid = (val: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const validGuestUuids = selectedGuestIds.filter(isUuid);

      // Call backend batch invite endpoint directly so tokens are in PostgreSQL database
      try {
        await invitationsApi.batchInvite(event.id, {
          guestIds: validGuestUuids.length > 0 ? validGuestUuids : undefined,
          channel,
          templateId: details.templateId,
          imageUrl: details.imageUrl,
          letterDetails: details as any,
        });
      } catch (backendErr: any) {
        console.error('[InvitationWizard] Backend batch invite error:', backendErr);
        const status = backendErr?.response?.status;
        // Rethrow for any non-404 HTTP error (including 3xx redirects like 310, 4xx, 5xx)
        if (status && status !== 404) {
          throw new Error(apiErrorMessage(backendErr, 'Server error while generating digital invitations'));
        }
        // 404 = guests not yet in DB, fall through to local store
      }

      // Also register in local invitation store
      const { sentCount } = sendInvitations(event.id, selectedGuestIds, channel, details);
      showToast(`Successfully dispatched ${sentCount || recipientCount} invitations via ${channel}!`, 'success');
      onInvitationsSent();
      onClose();
    } catch (err: any) {
      console.error('[InvitationWizard Dispatch Error]', err);
      showToast(err?.message || 'Failed to dispatch invitations. Please try again.', 'error');
    } finally {
      setIsDispatching(false);
    }
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
                  Explore bespoke invitation suites rendered with your live event details. Cards with 📸 support custom couple & honoree photography.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {availableTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleChooseTemplateAndPreview(tmpl)}
                    className="group relative cursor-pointer rounded-2xl p-2 border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--violet)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {tmpl.supportsImage && (
                      <span className="absolute top-4 right-4 z-20 text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold shadow-md backdrop-blur-md">
                        <Camera size={11} /> Photo Suite
                      </span>
                    )}

                    <div className="pointer-events-none scale-95 origin-top">
                      <InvitationCardPreview template={tmpl} details={details} compact={true} />
                    </div>
                    <div className="p-3 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-[var(--color-ink)] truncate max-w-[170px]">{tmpl.title}</h4>
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
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-ink)]">
                      Card Design Selected: {chosenTemplate.title}
                    </h4>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      Ready to send to {recipientCount} guest{recipientCount === 1 ? '' : 's'}. Each
                      guest receives a personalized digital invitation link.
                    </p>
                  </div>
                </div>

                {chosenTemplate.supportsImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPendingTemplate(chosenTemplate);
                      setTempPhotoUrl(details.imageUrl || chosenTemplate.defaultImage || '');
                      setPhotoModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Camera size={13} /> {details.imageUrl ? 'Change Photo' : 'Upload Photo'}
                  </button>
                )}
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
              disabled={isDispatching}
              className="ops-button primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDispatching ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send size={16} /> Dispatch {recipientCount} Invitations
                </>
              )}
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

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {previewingTemplate.supportsImage && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPendingTemplate(previewingTemplate);
                    setTempPhotoUrl(details.imageUrl || previewingTemplate.defaultImage || '');
                    setPhotoModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition font-bold text-xs flex items-center gap-1.5"
                >
                  <Camera size={14} /> Change Photo
                </button>
              )}
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

      {/* PHOTO UPLOAD & CUSTOMIZATION PROMPT MODAL */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[var(--color-surface-elevated)] border border-[var(--color-line)] shadow-2xl p-6 text-left">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-ink)] flex items-center gap-2">
                    Add Featured Photo
                    <span className="text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                      Required for this suite
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {photoPendingTemplate?.title || chosenTemplate.title} is a photo suite. Upload your photo or pick a curated preset below to finalize.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoModalOpen(false);
                  setPhotoPendingTemplate(null);
                }}
                className="p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Photo Preview Thumbnail */}
            <div className="relative mb-5 rounded-2xl overflow-hidden border border-[var(--color-line)] bg-black/40 h-52 flex items-center justify-center shadow-inner">
              {tempPhotoUrl ? (
                <>
                  <img
                    src={tempPhotoUrl}
                    alt="Selected preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white flex items-center gap-1.5">
                    <Sparkles size={11} className="text-amber-400" /> Active Photo Preview
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <UploadCloud size={28} className="text-amber-400" />
                  <span>No photo selected yet</span>
                </div>
              )}
            </div>

            {/* Upload File Input */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[var(--color-ink)] mb-1.5">
                Upload Custom Photo from Device
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoFileUpload}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-500 hover:file:bg-amber-500/30 cursor-pointer border border-[var(--color-line)] rounded-xl p-1 bg-[var(--color-surface)]"
              />
            </div>

            {/* Curated Presets */}
            <div className="mb-6">
              <span className="block text-xs font-bold text-[var(--color-ink)] mb-2">
                Or Select from Curated Studio Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setTempPhotoUrl(preset.url)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs text-left transition ${
                      tempPhotoUrl === preset.url
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300 ring-2 ring-amber-400/30'
                        : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-ink-muted)]'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                    <span className="truncate font-semibold">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-line)]">
              <button
                type="button"
                onClick={() => {
                  setPhotoModalOpen(false);
                  setPhotoPendingTemplate(null);
                }}
                className="px-4 py-2 rounded-xl border border-[var(--color-line)] text-xs font-semibold text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
              >
                <Check size={16} /> Save & Finalize Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
