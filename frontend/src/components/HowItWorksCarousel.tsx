import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Gauge,
  UsersRound,
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
    accent: 'rgba(146, 125, 255, 0.18)',
    highlights: ['Multi-gate routing', 'Custom guest tiers', 'Draft-to-Active toggle'],
  },
  {
    number: '02',
    badge: 'GUEST LIST',
    title: 'Import & Organize Guests',
    description:
      'Upload prepared Excel or CSV spreadsheets in seconds. Occassia instantly creates a unique cryptographic QR backup pass for every guest.',
    icon: UsersRound,
    color: '#4bd6ce',
    accent: 'rgba(75, 214, 206, 0.18)',
    highlights: ['Spreadsheet bulk upload', 'Unique QR backup pass', 'Plus-one & payment tracking'],
  },
  {
    number: '03',
    badge: 'NFC PROVISIONING',
    title: 'Pair Physical NFC Cards',
    description:
      'Tap any standard NFC card or wristband against a phone or desktop USB reader. The hardware UID links to the guest in a single tap.',
    icon: CreditCard,
    color: '#f59e0b',
    accent: 'rgba(245, 158, 11, 0.18)',
    highlights: ['Zero manual UID typing', 'Phone & USB bridge support', 'Recycled card release'],
  },
  {
    number: '04',
    badge: 'GATE CHECK-IN',
    title: 'Check In Under 1 Second',
    description:
      'Gate staff welcome attendees with an instant NFC tap. If a card is ever lost, camera scanning validates the guest’s QR pass immediately.',
    icon: Radio,
    color: '#10b981',
    accent: 'rgba(16, 185, 129, 0.18)',
    highlights: ['Sub-second NFC arrival', 'Instant camera QR fallback', 'Duplicate tap protection'],
  },
  {
    number: '05',
    badge: 'LIVE MONITORING',
    title: 'Live Sync & Audit Reports',
    description:
      'Follow attendance counts as they happen with WebSocket live feeds across all staff devices. Export comprehensive PDF or CSV audit reports.',
    icon: BarChart3,
    color: '#ec4899',
    accent: 'rgba(236, 72, 153, 0.18)',
    highlights: ['Real-time WebSocket feed', 'Multi-device sync', 'Official audit trail export'],
  },
];

export default function HowItWorksCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isWheelLocked, setIsWheelLocked] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wheelLockTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = steps.length;

  const goTo = useCallback((idx: number) => {
    setActiveIndex(Math.max(0, Math.min(idx, total - 1)));
    setTilt({ x: 0, y: 0 });
  }, [total]);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
    setTilt({ x: 0, y: 0 });
  }, [total]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
    setTilt({ x: 0, y: 0 });
  }, [total]);

  // Handle wheel navigation with cooldown
  const handleWheel = (e: React.WheelEvent) => {
    // Only capture if delta is meaningful
    if (Math.abs(e.deltaY) < 18 && Math.abs(e.deltaX) < 18) return;
    if (isWheelLocked) return;

    setIsWheelLocked(true);
    if (e.deltaY > 0 || e.deltaX > 0) {
      next();
    } else {
      prev();
    }

    if (wheelLockTimerRef.current) window.clearTimeout(wheelLockTimerRef.current);
    wheelLockTimerRef.current = window.setTimeout(() => {
      setIsWheelLocked(false);
    }, 380);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;
      // If user is focused inside or scrolling near the carousel
      const rect = container.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowRight') {
        next();
      } else if (e.key === 'ArrowLeft') {
        prev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (wheelLockTimerRef.current) window.clearTimeout(wheelLockTimerRef.current);
    };
  }, [next, prev]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    setTouchStartX(null);
  };

  // 3D subtle mouse tilt on active card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const currentStep = steps[activeIndex];

  return (
    <section id="how-it-works" className="how-section" ref={containerRef}>
      <div className="how-container">
        {/* Header */}
        <div className="how-header">
          <div className="how-eyebrow">
            <Sparkles size={14} /> STEP-BY-STEP WORKFLOW
          </div>
          <h2 className="how-title">
            See how Occassia <em>powers every gate.</em>
          </h2>
          <p className="how-subtitle">
            Shuffle through each step like switching apps on a phone. Scroll the dial, swipe, or click the PC arrows to explore the flow.
          </p>
        </div>

        {/* Carousel Deck & PC Navigation Controls */}
        <div
          className="how-stage-wrapper"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
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

          {/* 3D Phone Multitasking Deck */}
          <div className="how-deck" aria-roledescription="carousel" aria-label="How Occassia works steps">
            {steps.map((step, index) => {
              const diff = index - activeIndex;
              const isActive = diff === 0;
              const Icon = step.icon;

              // Calculate 3D transforms to simulate phone recent-app stack
              let transformStyle = '';
              let opacity = 0;
              let zIndex = 1;
              let pointerEvents: 'auto' | 'none' = 'none';

              if (isActive) {
                transformStyle = `translate3d(0, 0, 0) scale(1) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`;
                opacity = 1;
                zIndex = 20;
                pointerEvents = 'auto';
              } else if (diff > 0) {
                // Cards stacked to the right/behind
                const offset = Math.min(diff, 3);
                const xOffset = offset === 1 ? 130 : offset === 2 ? 220 : 280;
                const zOffset = offset * -70;
                const scale = Math.max(0.68, 1 - offset * 0.12);
                const rotY = Math.min(26, offset * 11);
                transformStyle = `translate3d(${xOffset}px, 0, ${zOffset}px) scale(${scale}) rotateY(-${rotY}deg)`;
                opacity = offset === 1 ? 0.72 : offset === 2 ? 0.38 : 0;
                zIndex = 20 - offset;
                pointerEvents = offset <= 2 ? 'auto' : 'none';
              } else {
                // Cards stacked to the left/behind
                const offset = Math.min(Math.abs(diff), 3);
                const xOffset = offset === 1 ? -130 : offset === 2 ? -220 : -280;
                const zOffset = offset * -70;
                const scale = Math.max(0.68, 1 - offset * 0.12);
                const rotY = Math.min(26, offset * 11);
                transformStyle = `translate3d(${xOffset}px, 0, ${zOffset}px) scale(${scale}) rotateY(${rotY}deg)`;
                opacity = offset === 1 ? 0.72 : offset === 2 ? 0.38 : 0;
                zIndex = 20 - offset;
                pointerEvents = offset <= 2 ? 'auto' : 'none';
              }

              return (
                <article
                  key={step.number}
                  className={`app-switcher-card ${isActive ? 'is-active is-floating' : 'is-stacked'}`}
                  style={{
                    transform: transformStyle,
                    opacity,
                    zIndex,
                    pointerEvents,
                    borderColor: isActive ? step.color : 'rgba(255, 255, 255, 0.12)',
                    boxShadow: isActive
                      ? `0 24px 50px -12px rgba(0, 0, 0, 0.4), 0 0 35px -5px ${step.accent}`
                      : '0 12px 28px rgba(0, 0, 0, 0.2)',
                  }}
                  onClick={() => !isActive && goTo(index)}
                  onMouseMove={isActive ? handleMouseMove : undefined}
                  onMouseLeave={isActive ? handleMouseLeave : undefined}
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

                  {/* Card Main Body */}
                  <div className="card-inner-content">
                    {/* Header with glowing icon badge */}
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

                    {/* Feature micro-highlights */}
                    <div className="card-highlights">
                      {step.highlights.map((item) => (
                        <div key={item} className="highlight-row">
                          <CheckCircle2 size={13} style={{ color: step.color, flexShrink: 0 }} />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Card Footer */}
                    <div className="card-bottom-pill">
                      <span className="indicator-dot" style={{ backgroundColor: step.color }} />
                      <span className="indicator-text">
                        {isActive ? 'Active Stage' : 'Click to preview'}
                      </span>
                      {isActive && <span className="stage-progress">{step.number} / 05</span>}
                    </div>
                  </div>
                </article>
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
            title="Scroll mouse wheel here to shuffle steps, or click any number"
            role="slider"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={activeIndex + 1}
            tabIndex={0}
          >
            {/* SVG rotating ring & progress arc */}
            <svg className="dial-svg" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="64"
                className="dial-track-circle"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                className="dial-active-arc"
                style={{
                  stroke: currentStep.color,
                  strokeDasharray: '402',
                  strokeDashoffset: `${402 - (402 * (activeIndex + 1)) / total}`,
                }}
              />
              {/* Rotating Pointer Needle */}
              <g
                className="dial-needle-group"
                style={{
                  transform: `rotate(${(activeIndex / total) * 360}deg)`,
                  transformOrigin: '80px 80px',
                }}
              >
                <circle cx="80" cy="16" r="6" fill={currentStep.color} />
                <circle cx="80" cy="16" r="11" fill="none" stroke={currentStep.color} strokeWidth="2" opacity="0.4" />
              </g>
            </svg>

            {/* Step buttons placed along the circle */}
            {steps.map((s, idx) => {
              const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
              const radius = 64; // matches SVG radius
              const x = 80 + radius * Math.cos(angle);
              const y = 80 + radius * Math.sin(angle);
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
