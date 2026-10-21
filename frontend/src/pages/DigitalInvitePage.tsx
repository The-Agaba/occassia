import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInvitationStore } from '../store/invitationStore';
import { publicApi } from '../api';
import InvitationCardPreview from '../components/InvitationCardPreview';
import { CARD_TEMPLATES, type CardTemplate } from '../lib/invitationTemplates';
import type { InvitationRecord, InvitationLetterDetails } from '../types';
import { Calendar, Clock, MapPin, Phone, MessageSquare, Check, X, Sparkles, Navigation, Heart, ArrowDown, Loader2 } from 'lucide-react';

export default function DigitalInvitePage() {
  const { token = '' } = useParams<{ token: string }>();
  const getInvitationByToken = useInvitationStore((s) => s.getInvitationByToken);
  const submitRsvp = useInvitationStore((s) => s.submitRsvp);

  const [invite, setInvite] = useState<InvitationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [unsealed, setUnsealed] = useState(false);
  const [cardElevated, setCardElevated] = useState(false);

  // RSVP Form State
  const [attendance, setAttendance] = useState<'ATTENDING' | 'DECLINED'>('ATTENDING');
  const [headcount, setHeadcount] = useState(1);
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [dietary, setDietary] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  // Fallback demo invitation if token not in storage
  const defaultDetails: InvitationLetterDetails = {
    hostNames: 'Marie-Jane Kennedy & Nathan Vanderbilt',
    headline: 'Together with their families request the honor of your presence at their wedding celebration',
    eventDate: 'Saturday, 12th December 2026',
    eventTime: '4:00 PM (Guests seated by 3:30 PM)',
    venueName: 'The Serena Hotel, Kivukoni Ballroom',
    venueAddress: 'Kivukoni Front, Dar es Salaam, Tanzania',
    rsvpPhone: '+255 754 889 900',
    rsvpDeadline: '1st November 2026',
    dressCode: 'Black Tie & Elegant Swahili Luxury',
    additionalNotes: 'Cocktail reception and banquet dinner to follow immediately after the ceremony.',
    templateId: 'royal-botanical-gold',
    collectionType: 'wedding-invitations',
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. Check local store first
    const found = getInvitationByToken(token);
    if (found) {
      setInvite(found);
      setPhoneConfirm(found.phoneNumber || '');
      if (found.rsvpStatus !== 'PENDING') {
        setAttendance(found.rsvpStatus as 'ATTENDING' | 'DECLINED');
        setHeadcount(found.rsvpHeadcount || 1);
        setSubmitted(true);
      }
    }

    // 2. Fetch directly from backend publicApi so invite works on any device or fresh browser
    if (token) {
      publicApi
        .getInvitation(token)
        .then((res) => {
          const data = res.data;
          if (data) {
            const backendDetails: InvitationLetterDetails = (data.letterDetails as any) || {
              ...defaultDetails,
              templateId: data.templateId || defaultDetails.templateId,
              imageUrl: data.imageUrl || defaultDetails.imageUrl,
            };

            const backendRecord: InvitationRecord = {
              id: data.id,
              guestId: data.guestId,
              eventId: data.eventId,
              token: data.token,
              guestName: data.guestName || 'Honored Guest',
              phoneNumber: data.phoneNumber,
              whatsappNumber: data.whatsappNumber,
              email: data.email,
              categoryName: 'General',
              plusOnes: data.rsvpHeadcount > 1 ? 1 : 0,
              deliveryChannel: data.deliveryChannel,
              deliveryStatus: data.deliveryStatus || 'DELIVERED',
              rsvpStatus: data.rsvpStatus || 'PENDING',
              rsvpHeadcount: data.rsvpHeadcount || 1,
              rsvpDietary: data.rsvpDietary,
              rsvpMessage: data.rsvpMessage,
              rsvpConfirmedAt: data.rsvpConfirmedAt,
              invitationDetails: backendDetails,
            };

            setInvite(backendRecord);
            setPhoneConfirm(backendRecord.phoneNumber || '');
            if (backendRecord.rsvpStatus !== 'PENDING') {
              setAttendance(backendRecord.rsvpStatus as 'ATTENDING' | 'DECLINED');
              setHeadcount(backendRecord.rsvpHeadcount || 1);
              setSubmitted(true);
            }
          }
        })
        .catch((err) => {
          console.warn('Backend public invitation fetch note:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, getInvitationByToken]);

  const activeDetails: InvitationLetterDetails = invite?.invitationDetails || defaultDetails;
  const guestName = invite?.guestName || 'Honored Guest';
  const selectedTemplate: CardTemplate =
    CARD_TEMPLATES.find((t: CardTemplate) => t.id === activeDetails.templateId) || CARD_TEMPLATES[0];

  // Synthesize clean audio click when Bahasha is opened
  const playEnvelopeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio optional
    }
  };

  const handleOpenBahasha = () => {
    if (unsealed) return;
    playEnvelopeSound();
    setUnsealed(true);
    setTimeout(() => {
      setCardElevated(true);
    }, 700);
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Submit directly to backend publicApi so RSVP is recorded in database
      const apiRes = await publicApi.submitRsvp(token, {
        status: attendance,
        headcount: attendance === 'ATTENDING' ? headcount : 0,
        dietary,
        message,
        phoneConfirm,
      });

      if (apiRes.data) {
        setInvite((prev) =>
          prev
            ? {
                ...prev,
                rsvpStatus: attendance,
                rsvpHeadcount: attendance === 'ATTENDING' ? headcount : 0,
                rsvpDietary: dietary,
                rsvpMessage: message,
                phoneNumber: phoneConfirm || prev.phoneNumber,
              }
            : null
        );
      }
    } catch (err) {
      console.warn('Backend RSVP note (falling back to local):', err);
    }

    // 2. Also update local store so offline / host view is synchronized
    const localRes = submitRsvp(token, {
      status: attendance,
      headcount: attendance === 'ATTENDING' ? headcount : 0,
      dietary,
      message,
      phoneConfirm,
    });

    if (localRes.invite && !invite) {
      setInvite(localRes.invite);
    }

    setIsSubmitting(false);
    setSubmitted(true);
    if (attendance === 'ATTENDING') {
      setSubmitSuccessMsg(`Asante sana ${guestName}! We are overjoyed to celebrate with you.`);
    } else {
      setSubmitSuccessMsg(`Thank you ${guestName} for informing us. You will be missed!`);
    }
  };

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`${activeDetails.headline} - ${activeDetails.hostNames}`);
    const details = encodeURIComponent(
      `Occassia Digital Invitation\nHosts: ${activeDetails.hostNames}\nVenue: ${activeDetails.venueName}\nRSVP: ${activeDetails.rsvpPhone}`
    );
    const location = encodeURIComponent(`${activeDetails.venueName}, ${activeDetails.venueAddress}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  if (loading && !invite) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col items-center justify-center p-6">
        <Loader2 size={36} className="animate-spin text-amber-400 mb-4" />
        <p className="text-sm font-medium tracking-wide text-slate-400">Loading your private invitation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col items-center selection:bg-amber-500/30 font-sans pb-24 overflow-x-hidden">
      {/* Ambient background illumination */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-b from-amber-600/10 via-emerald-600/5 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute top-[60%] -left-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-[70%] -right-32 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-20 w-full max-w-4xl px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-200 p-[1px]">
            <div className="w-full h-full bg-[#0d1118] rounded-[11px] flex items-center justify-center">
              <Sparkles size={14} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase text-slate-300">
            OCCASSIA <span className="text-amber-400 text-xs font-normal">v2.0</span>
          </span>
        </Link>
        <span className="text-[11px] uppercase tracking-widest text-amber-300/80 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Heart size={10} className="fill-amber-400 text-amber-400" /> Private Invitation
        </span>
      </header>

      {/* Main Interactive Stage */}
      <main className="relative z-10 w-full max-w-3xl px-4 flex flex-col items-center mt-4">
        {/* Guest Greeting Header */}
        <div className="text-center mb-8 animate-fade-in">
          <span className="text-xs uppercase tracking-[0.3em] text-amber-400/90 font-medium">
            Personal Invitation for
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-medium mt-1 text-white tracking-wide">
            {guestName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
            You are cordially invited to celebrate this memorable milestone.
          </p>
        </div>

        {/* ============================================================== */}
        {/* 3D "BAHASHA" (TANZANIAN SEALED ENVELOPE) STAGE */}
        {/* ============================================================== */}
        <div className="w-full flex flex-col items-center my-4 perspective-1000">
          {!unsealed ? (
            <div className="flex flex-col items-center">
              {/* Animated Prompt Arrow */}
              <div className="flex flex-col items-center gap-1 mb-4 animate-bounce text-amber-300 cursor-pointer" onClick={handleOpenBahasha}>
                <span className="text-xs uppercase tracking-widest font-semibold bg-amber-500/20 px-4 py-1.5 rounded-full border border-amber-500/30 shadow-lg backdrop-blur-md">
                  Tap the Bahasha to Open
                </span>
                <ArrowDown size={20} className="text-amber-400 animate-pulse mt-1" />
              </div>

              {/* Sealed Envelope Container */}
              <div
                onClick={handleOpenBahasha}
                role="button"
                tabIndex={0}
                aria-label="Click to open invitation letter"
                className="group relative w-[320px] sm:w-[420px] h-[230px] sm:h-[280px] bg-gradient-to-b from-[#202736] to-[#121622] rounded-2xl shadow-2xl border border-amber-500/20 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:border-amber-400/40 hover:shadow-amber-500/10 hover:shadow-2xl flex items-center justify-center overflow-hidden"
              >
                {/* Envelope fold textures & subtle Swahili geometric pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Triangle Flap (Sealed) */}
                <div
                  className="absolute top-0 left-0 right-0 h-[140px] sm:h-[160px] bg-gradient-to-b from-[#293245] to-[#1a2130] border-b border-amber-500/30 transition-transform duration-700 origin-top shadow-lg flex items-center justify-center"
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
                  }}
                />

                {/* Left & Right inner fold overlays */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%), linear-gradient(-135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
                  }}
                />

                {/* Wax Seal with Gold Crest */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#9b1c1c] via-[#b91c1c] to-[#dc2626] border-2 border-amber-300/60 shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-amber-400/50 flex flex-col items-center justify-center text-amber-200">
                      <Sparkles size={16} className="text-amber-300" />
                      <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5 font-serif">
                        SEALED
                      </span>
                    </div>
                  </div>
                  <span className="mt-3 text-[11px] font-serif uppercase tracking-widest text-amber-200/90 drop-shadow">
                    Occassia • Rasmi
                  </span>
                </div>

                {/* Bottom envelope rim shine */}
                <div className="absolute bottom-3 text-[11px] text-slate-400/80 font-mono tracking-wider">
                  Tap or click to unseal
                </div>
              </div>
            </div>
          ) : (
            /* Open Bahasha Animation + Invitation Card Revealed */
            <div className="w-full flex flex-col items-center animate-fade-in">
              {/* Envelope Body in background */}
              <div className="relative w-full flex flex-col items-center">
                {/* Status chip */}
                <div className="mb-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
                  <Sparkles size={13} />
                  <span>Bahasha Opened • Digital Invitation Card</span>
                </div>

                {/* The Unfolded Invitation Card */}
                <div
                  className={`w-full max-w-lg transition-all duration-1000 transform ${
                    cardElevated
                      ? 'translate-y-0 opacity-100 scale-100'
                      : '-translate-y-12 opacity-50 scale-95'
                  }`}
                >
                  <div className="relative shadow-2xl rounded-3xl overflow-hidden border border-amber-500/30">
                    <InvitationCardPreview
                      template={selectedTemplate}
                      details={activeDetails}
                      guestName={guestName}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* EVENT DETAILS & DIRECTIONS (Always shown or revealed when unsealed) */}
        {/* ============================================================== */}
        {unsealed && (
          <div className="w-full max-w-xl mt-8 space-y-6 animate-fade-in">
            {/* Quick Actions Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <h2 className="text-base font-serif font-bold text-amber-200 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-amber-400" /> Event Itinerary & Location
              </h2>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-medium">Date & Day</strong>
                    <span className="text-slate-300">{activeDetails.eventDate}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-medium">Time</strong>
                    <span className="text-slate-300">{activeDetails.eventTime}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-medium">{activeDetails.venueName}</strong>
                    <span className="text-slate-300">{activeDetails.venueAddress}</span>
                  </div>
                </div>

                {activeDetails.dressCode && (
                  <div className="flex items-start gap-3">
                    <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white font-medium">Dress Code</strong>
                      <span className="text-slate-300">{activeDetails.dressCode}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Map & Calendar Buttons */}
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    activeDetails.venueName + ' ' + activeDetails.venueAddress
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-2 border border-white/10 transition"
                >
                  <Navigation size={14} className="text-emerald-400" /> Open in Maps
                </a>

                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold text-amber-200 flex items-center justify-center gap-2 border border-amber-400/30 transition"
                >
                  <Calendar size={14} className="text-amber-400" /> Add to Calendar
                </a>
              </div>
            </div>

            {/* ============================================================== */}
            {/* RSVP SECTION */}
            {/* ============================================================== */}
            <div id="rsvp" className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#141923] to-[#0d1017] border border-amber-500/20 shadow-2xl relative">
              <div className="text-center mb-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400">
                  Response Requested
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                  RSVP for {guestName}
                </h3>
                {activeDetails.rsvpDeadline && (
                  <p className="text-xs text-slate-400 mt-1">
                    Kindly respond by {activeDetails.rsvpDeadline}
                  </p>
                )}
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                    <Check size={24} />
                  </div>
                  <h4 className="text-base font-bold text-white">RSVP Status: {attendance}</h4>
                  <p className="text-xs text-emerald-300 max-w-md mx-auto">{submitSuccessMsg}</p>
                  {attendance === 'ATTENDING' && (
                    <div className="text-xs text-slate-300 bg-white/5 py-2 px-4 rounded-xl inline-block mt-2">
                      Reserved Seats: <strong>{headcount}</strong>
                    </div>
                  )}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      Change response
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitRsvp} className="space-y-4 text-xs sm:text-sm">
                  {/* Attendance Choice */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAttendance('ATTENDING')}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                        attendance === 'ATTENDING'
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Check size={18} className={attendance === 'ATTENDING' ? 'text-emerald-400' : 'text-slate-400'} />
                      <span className="font-semibold text-xs">Joyfully Accepts</span>
                      <small className="text-[10px] text-slate-400">Will attend celebration</small>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendance('DECLINED')}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                        attendance === 'DECLINED'
                          ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <X size={18} className={attendance === 'DECLINED' ? 'text-rose-400' : 'text-slate-400'} />
                      <span className="font-semibold text-xs">Regretfully Declines</span>
                      <small className="text-[10px] text-slate-400">Cannot attend in person</small>
                    </button>
                  </div>

                  {attendance === 'ATTENDING' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Number of Attending Guests
                      </label>
                      <select
                        value={headcount}
                        onChange={(e) => setHeadcount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value={1} className="bg-slate-900">1 Guest (Single Attendance)</option>
                        {invite && invite.plusOnes > 0 && (
                          <option value={2} className="bg-slate-900">2 Guests (Myself + Plus One)</option>
                        )}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Phone Number (For verification & updates)
                    </label>
                    <input
                      type="text"
                      value={phoneConfirm}
                      onChange={(e) => setPhoneConfirm(e.target.value)}
                      placeholder="+255 7XX XXX XXX or 07XX XXX XXX"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  {attendance === 'ATTENDING' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Dietary Preference or Allergies (Optional)
                      </label>
                      <input
                        type="text"
                        value={dietary}
                        onChange={(e) => setDietary(e.target.value)}
                        placeholder="e.g. Vegetarian, Halal, Nut allergy, etc."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                      </input>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Warm Message or Congratulations to Hosts (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your heartfelt wishes..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      'Recording RSVP...'
                    ) : (
                      <>
                        <Sparkles size={16} /> Confirm RSVP
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ============================================================== */}
            {/* RSVP HOTLINE & ASSISTANCE GUIDANCE */}
            {/* ============================================================== */}
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Need Assistance or Directions?</h4>
                  <p className="text-[11px] text-slate-400">
                    Contact the official RSVP coordinator directly: {activeDetails.rsvpPhone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`tel:${activeDetails.rsvpPhone}`}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition"
                >
                  <Phone size={13} /> Call RSVP
                </a>

                <a
                  href={`https://wa.me/${activeDetails.rsvpPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Habari, regarding the invitation to ${activeDetails.headline} celebrating ${activeDetails.hostNames}...`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <MessageSquare size={13} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 text-center text-[11px] text-slate-500">
        <p>Occassia Digital Invitations v2.0 • Secured Event Guest Access</p>
      </footer>
    </div>
  );
}
