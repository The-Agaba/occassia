import type { CardTemplate } from '../lib/invitationTemplates';
import type { InvitationLetterDetails } from '../types';

interface InvitationCardPreviewProps {
  template: CardTemplate;
  details: Partial<InvitationLetterDetails>;
  guestName?: string;
  className?: string;
  compact?: boolean;
}

export default function InvitationCardPreview({
  template,
  details,
  guestName,
  className = '',
  compact = false,
}: InvitationCardPreviewProps) {
  const hostNames = details.hostNames || 'Mariam & Amani';
  const headline = details.headline || 'The Wedding Celebration Of';
  const eventDate = details.eventDate || 'Saturday, December 12th, 2026';
  const ceremonyTime = details.ceremonyTime || '2:00 PM';
  const receptionTime = details.receptionTime || '6:00 PM';
  const venueName = details.venueName || 'Serena Hotel Ballroom';
  const venueAddress = details.venueAddress || 'Dar es Salaam, Tanzania';
  const dressCode = details.dressCode || 'Black Tie / Elegant Traditional';
  const rsvpDeadline = details.rsvpDeadline || 'December 1st, 2026';
  const personalMessage = details.personalMessage || 'Together with our families, we joyfully invite you to share our happiness and celebrate our union.';

  const theme = template.theme;

  return (
    <div
      className={`invitation-card-container relative overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background: theme.bgGradient,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        boxShadow: compact ? '0 10px 25px rgba(0,0,0,0.15)' : '0 25px 60px rgba(0,0,0,0.25)',
        borderRadius: compact ? '16px' : '22px',
        border: `1.5px solid ${theme.borderColor}`,
      }}
    >
      {/* Decorative Corner Ornaments */}
      {theme.decorStyle === 'botanical' && (
        <>
          <div className="absolute top-2 left-2 text-xl select-none opacity-60">🌿</div>
          <div className="absolute top-2 right-2 text-xl select-none opacity-60">🌿</div>
          <div className="absolute bottom-2 left-2 text-xl select-none opacity-60">🍃</div>
          <div className="absolute bottom-2 right-2 text-xl select-none opacity-60">🍃</div>
        </>
      )}

      {theme.decorStyle === 'swahili-gold' && (
        <>
          <div className="absolute top-3 left-3 text-xs select-none tracking-widest opacity-70">❖ ❖ ❖</div>
          <div className="absolute top-3 right-3 text-xs select-none tracking-widest opacity-70">❖ ❖ ❖</div>
          <div className="absolute bottom-3 left-3 text-xs select-none tracking-widest opacity-70">❖ ❖ ❖</div>
          <div className="absolute bottom-3 right-3 text-xs select-none tracking-widest opacity-70">❖ ❖ ❖</div>
        </>
      )}

      {theme.decorStyle === 'art-deco' && (
        <div
          className="absolute inset-2 pointer-events-none rounded-xl"
          style={{ border: `1px solid ${theme.accentColor}`, opacity: 0.4 }}
        />
      )}

      {/* Inner Card Framing */}
      <div
        className={`relative z-10 flex flex-col items-center text-center ${
          compact ? 'p-5' : 'p-8 sm:p-12'
        }`}
      >
        {/* Top Seal / Emblem */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-3 shadow-sm select-none"
          style={{
            background: theme.sealColor,
            color: '#fff',
            boxShadow: `0 4px 12px ${theme.sealColor}40`,
          }}
        >
          {theme.sealEmblem}
        </div>

        {/* Personalized Guest Honorific (if provided) */}
        {guestName && (
          <div
            className="text-[11px] font-semibold tracking-widest uppercase mb-3 px-3 py-0.5 rounded-full"
            style={{
              color: theme.accentColor,
              border: `1px solid ${theme.borderColor}50`,
              background: `${theme.borderColor}15`,
            }}
          >
            Special Invitation For {guestName}
          </div>
        )}

        {/* Headline */}
        <div
          className={`font-semibold uppercase tracking-[0.2em] ${
            compact ? 'text-[9px] mb-1' : 'text-xs mb-3'
          }`}
          style={{ color: theme.secondaryText }}
        >
          {headline}
        </div>

        {/* Couple / Host Names */}
        <h2
          className={`font-bold tracking-tight leading-none ${
            compact ? 'text-xl my-2' : 'text-3xl sm:text-5xl my-4'
          }`}
          style={{
            color: theme.textColor,
            textShadow: theme.cardBg === '#0c1630' || theme.cardBg === '#092a22' ? '0 2px 10px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {hostNames}
        </h2>

        {/* Divider Ornament */}
        <div className="flex items-center gap-3 my-2 opacity-60">
          <div className="h-[1px] w-8 sm:w-16" style={{ background: theme.borderColor }} />
          <span className="text-xs">✦</span>
          <div className="h-[1px] w-8 sm:w-16" style={{ background: theme.borderColor }} />
        </div>

        {/* Personal Note */}
        {!compact && (
          <p
            className="max-w-md text-xs sm:text-sm leading-relaxed my-3 font-normal"
            style={{ color: theme.secondaryText }}
          >
            {personalMessage}
          </p>
        )}

        {/* Date & Times Badge */}
        <div
          className={`w-full max-w-sm rounded-xl my-3 ${
            compact ? 'p-2.5 text-xs' : 'p-4 text-sm'
          }`}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${theme.borderColor}40`,
          }}
        >
          <div className="font-bold tracking-wide" style={{ color: theme.textColor }}>
            {eventDate}
          </div>
          <div className="flex justify-center items-center gap-4 mt-1 text-[11px]" style={{ color: theme.secondaryText }}>
            <span>Ceremony: <strong>{ceremonyTime}</strong></span>
            <span>•</span>
            <span>Reception: <strong>{receptionTime}</strong></span>
          </div>
        </div>

        {/* Venue Information */}
        <div className="my-2">
          <div className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: theme.textColor }}>
            {venueName}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: theme.secondaryText }}>
            {venueAddress}
          </div>
        </div>

        {/* Dress Code & RSVP Info */}
        {!compact && (
          <div className="mt-4 pt-4 border-t w-full flex flex-wrap justify-between items-center text-[11px]" style={{ borderColor: `${theme.borderColor}30` }}>
            <div style={{ color: theme.secondaryText }}>
              Dress Code: <strong style={{ color: theme.textColor }}>{dressCode}</strong>
            </div>
            <div style={{ color: theme.secondaryText }}>
              RSVP by {rsvpDeadline}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
