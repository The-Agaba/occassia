import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Gauge,
  UsersRound,
  Mail,
  CreditCard,
  Radio,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface HowItWorksStep {
  number: string;
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  accent: string;
  highlights: string[];
}

const steps: HowItWorksStep[] = [
  {
    number: '01',
    badge: 'EVENT SETUP',
    title: 'Create & Configure Event',
    description:
      'Set up venue details, entry gates, and guest tiers in one clean workspace. Switch the event to Active when your gate crew is ready.',
    icon: Gauge,
    color: '#927dff',
    accent: 'rgba(146, 125, 255, 0.22)',
    highlights: ['Multi-gate routing', 'Custom guest tiers', 'Draft-to-Active toggle'],
  },
  {
    number: '02',
    badge: 'GUEST LIST',
    title: 'Import & Organize Guests',
    description:
      'Upload prepared Excel or CSV spreadsheets in seconds. Occassia automatically standardizes phone numbers and generates unique backup QR passes.',
    icon: UsersRound,
    color: '#4bd6ce',
    accent: 'rgba(75, 214, 206, 0.22)',
    highlights: ['Excel spreadsheet bulk upload', 'Unique QR backup pass', 'Plus-one & payment tracking'],
  },
  {
    number: '03',
    badge: 'DIGITAL INVITATIONS',
    title: '3D Bahasha & Live RSVP',
    description:
      'Design luxury invitations, dispatch personalized links via WhatsApp or SMS, and collect real-time RSVPs with interactive wax-seal envelope animations.',
    icon: Mail,
    color: '#f43f5e',
    accent: 'rgba(244, 63, 94, 0.22)',
    highlights: ['Interactive 3D Bahasha unsealing', 'Direct WhatsApp & SMS dispatch', 'Live dietary & headcount sync'],
  },
  {
    number: '04',
    badge: 'NFC PROVISIONING',
    title: 'Pair Physical NFC Cards',
    description:
      'Tap any standard NFC card or wristband against a phone or desktop USB reader. The hardware UID links to the guest in a single tap.',
    icon: CreditCard,
    color: '#f59e0b',
    accent: 'rgba(245, 158, 11, 0.22)',
    highlights: ['Zero manual UID typing', 'Phone & USB bridge support', 'Recycled card release'],
  },
  {
    number: '05',
    badge: 'GATE CHECK-IN',
    title: 'Check In Under 1 Second',
    description:
      'Gate staff welcome attendees with an instant NFC tap. If a card is ever lost, camera scanning validates the guest’s QR pass immediately.',
    icon: Radio,
    color: '#10b981',
    accent: 'rgba(16, 185, 129, 0.22)',
    highlights: ['Sub-second NFC arrival', 'Instant camera QR fallback', 'Duplicate tap protection'],
  },
  {
    number: '06',
    badge: 'LIVE MONITORING',
    title: 'Live Sync & Audit Reports',
    description:
      'Follow attendance counts as they happen with WebSocket live feeds across all staff devices. Export comprehensive attendance and delivery reports.',
    icon: BarChart3,
    color: '#ec4899',
    accent: 'rgba(236, 72, 153, 0.22)',
    highlights: ['Real-time WebSocket feed', 'Multi-device sync', 'Official audit trail export'],
  },
];

// Helper to compute shortest circular distance between card and current continuous position
function getCircularDiff(targetIndex: number, currentPos: number, total: number) {
  const normPos = ((currentPos % total) + total) % total;
  let diff = targetIndex - normPos;
  while (diff > total / 2) diff -= total;
  while (diff < -total / 2) diff += total;
  return diff;
}

export default function HowItWorksCarousel() {
  const total = steps.length;

  // Continuous position state for fluid, non-abrupt motion (infinite wrapping)
  const [renderPos, setRenderPos] = useState(0);
  const positionRef = useRef(0);
  const targetPosRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Wheel and drag management
  const wheelDebounceTimerRef = useRef<number | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartPosRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Subtle mouse tilt for the active foreground card
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Physics animation loop using smooth interpolation (LERP)
  const startAnimationLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;

    const tick = () => {
      const current = positionRef.current;
      const target = targetPosRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.001) {
        const next = current + diff * 0.16;
        positionRef.current = next;
        setRenderPos(next);
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        positionRef.current = target;
        setRenderPos(target);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Jump to specific step along the shortest circular path
  const goTo = useCallback(
    (idx: number) => {
      const diff = getCircularDiff(idx, targetPosRef.current, total);
      targetPosRef.current += diff;
      setTilt({ x: 0, y: 0 });
      startAnimationLoop();
    },
    [total, startAnimationLoop]
  );

  // Infinite Next: advances by +1 without end boundary
  const next = useCallback(() => {
    targetPosRef.current = Math.round(targetPosRef.current) + 1;
    startAnimationLoop();
  }, [startAnimationLoop]);

  // Infinite Prev: advances by -1 without start boundary
  const prev = useCallback(() => {
    targetPosRef.current = Math.round(targetPosRef.current) - 1;
    startAnimationLoop();
  }, [startAnimationLoop]);

  // Continuous infinite wheel scroll handler
  const handleWheel = (e: React.WheelEvent) => {
    let delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) delta *= 25;
    if (e.deltaMode === 2) delta *= 300;

    if (Math.abs(delta) < 4) return;

    // Fluid continuous movement with wheel delta (infinite, no clamping)
    const stepDelta = delta * 0.0018;
    targetPosRef.current += stepDelta;
    startAnimationLoop();

    // Snap cleanly to nearest card once user stops scrolling
    if (wheelDebounceTimerRef.current) window.clearTimeout(wheelDebounceTimerRef.current);
    wheelDebounceTimerRef.current = window.setTimeout(() => {
      targetPosRef.current = Math.round(targetPosRef.current);
      startAnimationLoop();
    }, 180);
  };

  // Drag and touch gesture handling (cards follow cursor/finger 1:1, infinitely)
  const onPointerDown = (clientX: number) => {
    dragStartXRef.current = clientX;
    dragStartPosRef.current = positionRef.current;
    setIsDragging(true);
  };

  const onPointerMove = (clientX: number) => {
    if (dragStartXRef.current === null) return;
    const deltaX = clientX - dragStartXRef.current;
    const offset = deltaX / 280;
    targetPosRef.current = dragStartPosRef.current - offset;
    positionRef.current = targetPosRef.current;
    setRenderPos(targetPosRef.current);
  };

  const onPointerUp = () => {
    if (dragStartXRef.current === null) return;
    dragStartXRef.current = null;
    setIsDragging(false);
    targetPosRef.current = Math.round(targetPosRef.current);
    startAnimationLoop();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (wheelDebounceTimerRef.current) window.clearTimeout(wheelDebounceTimerRef.current);
    };
  }, [next, prev]);

  // Mouse tilt on the active card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Normalized active step computed from wrap-around position
  const normPos = ((renderPos % total) + total) % total;
  const activeIndex = Math.round(normPos) % total;
  const currentStep = steps[activeIndex];

  // Precise dot angle and coordinates on the circle (radius = 64, center = 80, 80)
  // Step 01 is at top (12 o'clock, -PI/2)
  const dialRadius = 64;
  const dialAngle = (normPos / total) * 2 * Math.PI - Math.PI / 2;
  const dotX = 80 + dialRadius * Math.cos(dialAngle);
  const dotY = 80 + dialRadius * Math.sin(dialAngle);

  // Active arc circumference = 2 * PI * 64 ~= 402.12
  const arcLength = ((normPos + 0.1) / total) * 402.12;
  const arcDashOffset = 402.12 - arcLength;

  return (
    <section id="how-it-works" className="how-section">
      <div className="how-container">
        {/* Section Header */}
        <div className="how-header">
          <div className="how-eyebrow">
            <Sparkles size={14} /> STEP-BY-STEP WORKFLOW
          </div>
          <h2 className="how-title">
            See how Occassia <em>powers every event.</em>
          </h2>
          <p className="how-subtitle">
            Drag, scroll with your wheel, or click the arrows to glide through the workflow endlessly.
          </p>
        </div>

        {/* 3D Stage & Interactive Drag Wrapper */}
        <div
          className={`how-stage-wrapper ${isDragging ? 'is-dragging' : ''}`}
          onWheel={handleWheel}
          onMouseDown={(e) => onPointerDown(e.clientX)}
          onMouseMove={(e) => isDragging && onPointerMove(e.clientX)}
          onMouseUp={onPointerUp}
          onMouseLeave={() => isDragging && onPointerUp()}
          onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
          onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
          onTouchEnd={onPointerUp}
        >
          {/* PC Left Arrow Button */}
          <button
            type="button"
            className="how-nav-arrow arrow-left"
            onClick={prev}
            aria-label="Previous step"
            title="Previous step (Arrow Left)"
          >
            <ChevronLeft size={22} />
          </button>

          {/* 3D Phone Multitasking Deck (Infinite Wrap) */}
          <div className="how-deck" aria-roledescription="carousel" aria-label="How Occassia works steps">
            {steps.map((step, index) => {
              // Circular relative offset (shortest path wrap)
              const rel = getCircularDiff(index, renderPos, total);
              const absRel = Math.abs(rel);
              const isActive = Math.abs(rel) < 0.45;
              const Icon = step.icon;

              // Continuous, smooth 3D transformations
              const xOffset = rel * 140;
              const zOffset = -absRel * 75;
              const rotY = Math.max(-25, Math.min(25, -rel * 12));
              const scale = Math.max(0.65, 1 - absRel * 0.12);
              const opacity = Math.max(0, 1 - absRel * 0.32);
              const zIndex = Math.round(30 - absRel * 6);

              const tiltX = isActive ? tilt.x : 0;
              const tiltY = isActive ? tilt.y : 0;

              return (
                <div
                  key={step.number}
                  className="carousel-card-slot"
                  style={{
                    transform: `translate3d(${xOffset}px, 0, ${zOffset}px) scale(${scale}) rotateY(${rotY + tiltX}deg) rotateX(${tiltY}deg)`,
                    opacity,
                    zIndex,
                    pointerEvents: absRel <= 1.5 ? 'auto' : 'none',
                  }}
                  onClick={() => !isActive && goTo(index)}
                  onMouseMove={isActive ? handleMouseMove : undefined}
                  onMouseLeave={isActive ? handleMouseLeave : undefined}
                >
                  {/* Inner card with separate floating animation */}
                  <article
                    className={`app-switcher-card ${isActive ? 'is-active is-floating' : 'is-stacked'}`}
                    style={{
                      borderColor: isActive ? step.color : 'rgba(255, 255, 255, 0.12)',
                      boxShadow: isActive
                        ? `0 24px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px -5px ${step.accent}`
                        : '0 12px 28px rgba(0, 0, 0, 0.3)',
                    }}
                    role="tabpanel"
                    aria-hidden={!isActive}
                  >
                    {/* Phone status bar simulation */}
                    <div className="card-phone-bar">
                      <div className="phone-notch">
                        <span className="notch-camera" />
                        <span className="notch-speaker" />
                      </div>
                      <div className="phone-status-info">
                        <span className="phone-brand">OCCASSIA</span>
                        <span className="phone-step-pill" style={{ color: step.color, background: step.accent }}>
                          STEP {step.number}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-inner-content">
                      {/* Step Header */}
                      <div className="card-step-header">
                        <div
                          className="card-icon-badge"
                          style={{ color: step.color, backgroundColor: step.accent, borderColor: step.color }}
                        >
                          <Icon size={22} strokeWidth={2} />
                        </div>
                        <div className="card-meta">
                          <span className="card-kicker" style={{ color: step.color }}>
                            {step.badge}
                          </span>
                          <h3 className="card-title">{step.title}</h3>
                        </div>
                      </div>

                      {/* Step Description */}
                      <p className="card-desc">{step.description}</p>

                      {/* Feature Highlights */}
                      <div className="card-highlights">
                        {step.highlights.map((item) => (
                          <div key={item} className="highlight-row">
                            <CheckCircle2 size={13} style={{ color: step.color, flexShrink: 0 }} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Footer Pill */}
                      <div className="card-bottom-pill">
                        <span className="indicator-dot" style={{ backgroundColor: step.color }} />
                        <span className="indicator-text">
                          {isActive ? 'Active Stage' : 'Click to bring to front'}
                        </span>
                        {isActive && <span className="stage-progress">{step.number} / 06</span>}
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

          {/* PC Right Arrow Button */}
          <button
            type="button"
            className="how-nav-arrow arrow-right"
            onClick={next}
            aria-label="Next step"
            title="Next step (Arrow Right)"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Circular Dial Controller & Progress Wheel */}
        <div className="dial-control-container">
          {/* Scrollable Circle Dial */}
          <div
            className="scroll-circle-dial"
            onWheel={handleWheel}
            title="Scroll mouse wheel here to shuffle steps infinitely, or click any number"
            role="slider"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={activeIndex + 1}
            tabIndex={0}
          >
            {/* SVG rotating ring & precise position tracking */}
            <svg className="dial-svg" viewBox="0 0 160 160">
              {/* Background circular track */}
              <circle cx="80" cy="80" r="64" className="dial-track-circle" />

              {/* Progress arc starting at 12 o'clock (-90deg) */}
              <circle
                cx="80"
                cy="80"
                r="64"
                className="dial-active-arc"
                transform="rotate(-90 80 80)"
                style={{
                  stroke: currentStep.color,
                  strokeDasharray: '402.12',
                  strokeDashoffset: `${arcDashOffset}`,
                }}
              />

              {/* Glowing live dot directly centered on the active track position */}
              <circle cx={dotX} cy={dotY} r="14" fill={currentStep.color} opacity="0.25" />
              <circle cx={dotX} cy={dotY} r="8" fill="none" stroke={currentStep.color} strokeWidth="2" opacity="0.7" />
              <circle cx={dotX} cy={dotY} r="5" fill={currentStep.color} />
            </svg>

            {/* Step buttons placed along the circle (Node 01 is at top/12 o'clock) */}
            {steps.map((s, idx) => {
              const nodeAngle = (idx / total) * 2 * Math.PI - Math.PI / 2;
              const x = 80 + dialRadius * Math.cos(nodeAngle);
              const y = 80 + dialRadius * Math.sin(nodeAngle);
              const isSelected = idx === activeIndex;

              return (
                <button
                  key={s.number}
                  type="button"
                  className={`dial-step-node ${isSelected ? 'is-selected' : ''}`}
                  style={{
                    left: `${(x / 160) * 100}%`,
                    top: `${(y / 160) * 100}%`,
                    backgroundColor: isSelected ? s.color : undefined,
                    color: isSelected ? '#fff' : undefined,
                  }}
                  onClick={() => goTo(idx)}
                  aria-label={`Jump to Step ${s.number}: ${s.title}`}
                >
                  {s.number}
                </button>
              );
            })}

            {/* Inner Center Hub */}
            <div className="dial-center-hub">
              <span className="hub-step-count" style={{ color: currentStep.color }}>
                {currentStep.number}
              </span>
              <span className="hub-label">SCROLL DIAL</span>
            </div>
          </div>

          {/* Quick Step Indicators below dial */}
          <div className="dial-indicators-row">
            {steps.map((st, i) => (
              <button
                key={st.number}
                type="button"
                className={`dial-pill-indicator ${i === activeIndex ? 'active' : ''}`}
                style={{
                  backgroundColor: i === activeIndex ? st.color : undefined,
                }}
                onClick={() => goTo(i)}
                aria-label={`Step ${st.number}`}
              >
                <span>{st.number}</span>
                <span className="pill-name">{st.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
