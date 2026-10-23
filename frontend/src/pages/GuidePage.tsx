import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Gauge,
  Mail,
  QrCode,
  Radio,
  ScanLine,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

type Step = {
  number: string;
  title: string;
  eyebrow: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
  action?: { label: string; to: string };
};

const steps: Step[] = [
  {
    number: '01',
    title: 'Set up the event',
    eyebrow: 'START HERE',
    description: 'Create one unified workspace for the occasion, configuring venue details, dates, and access gates.',
    detail: 'Add the date, venue address, custom guest tiers, and entry gates. Switch the event from Draft to Active when the gate crew is ready.',
    icon: Gauge,
    tone: 'violet',
    action: { label: 'Open events', to: '/dashboard' },
  },
  {
    number: '02',
    title: 'Bring in your guests',
    eyebrow: 'BUILD THE LIST',
    description: 'Add guests individually or bulk-import formatted Excel/CSV files with automatic Tanzanian phone standardization.',
    detail: 'Categories make it effortless to identify VIPs and families. Each attendee automatically receives a cryptographic QR backup ticket token.',
    icon: UsersRound,
    tone: 'cyan',
    action: { label: 'Import guests', to: '/dashboard' },
  },
  {
    number: '03',
    title: 'Digital Invitations & RSVP',
    eyebrow: 'INVITE & CONFIRM',
    description: 'Design personalized digital invitations and broadcast links via WhatsApp or SMS. Guests open their invite, confirm attendance, dietary needs, and headcount in seconds.',
    detail: 'Every guest receives a unique invitation link. They open it on any device and RSVP with headcount, dietary preferences, and a personal message — all synced live to your dashboard.',
    icon: Mail,
    tone: 'violet',
    action: { label: 'Explore invitations', to: '/dashboard' },
  },
  {
    number: '04',
    title: 'Prepare NFC cards',
    eyebrow: 'CARD PROVISIONING',
    description: 'Register physical cards or wristbands by hardware UID, then assign them to confirmed attendees in one click.',
    detail: 'Tap cards against a phone or desktop USB reader. The UID is captured and mapped to the guest with zero manual typing required.',
    icon: CreditCard,
    tone: 'gold',
    action: { label: 'Open card inventory', to: '/card-control' },
  },
  {
    number: '05',
    title: 'Check guests in at the gate',
    eyebrow: 'AT THE ENTRANCE',
    description: 'Scan NFC cards with sub-second arrival verification. If a guest loses their card, camera QR scan provides instant fallback.',
    detail: 'Double-tap lockout, wrong-event alarms, and lost card safeguards prevent gate chaos. Compact 80mm×50mm entrance tickets auto-print on tap.',
    icon: Radio,
    tone: 'emerald',
    action: { label: 'Gate check-in', to: '/dashboard' },
  },
  {
    number: '06',
    title: 'Monitor live & export reports',
    eyebrow: 'STAY IN CONTROL',
    description: 'Track entries as they occur via live WebSocket feeds, category charts, gate logs, and comprehensive audit reports.',
    detail: 'Real-time telemetry keeps coordinators synchronized across multiple venues, with durable platform counters that withstand event archiving.',
    icon: BarChart3,
    tone: 'cyan',
    action: { label: 'Live monitoring', to: '/dashboard' },
  },
];

const roles = [
  { name: 'Super Admin', text: 'Full multi-organization administration and system-wide audit controls.' },
  { name: 'Admin', text: 'Event creation, digital invitations, card pooling, user management, and exports.' },
  { name: 'Event Manager', text: 'Guest roster curation, Excel batch imports, card assignment, and gate monitoring.' },
  { name: 'Check-in Staff', text: 'Fast gate entrance verification via phone NFC tap and QR camera backup.' },
  { name: 'Viewer', text: 'Read-only access to live occupancy telemetry and summary attendance reports.' },
];

export default function GuidePage() {
  const [activeStep, setActiveStep] = useState(0);
  const user = useAuthStore((state) => state.user);
  const step = steps[activeStep];
  const Icon = step.icon;

  const move = (direction: number) => {
    setActiveStep((current) => Math.min(Math.max(current + direction, 0), steps.length - 1));
  };

  return (
    <div className="guide-page">
      <div className="guide-page-inner">
        <section className="guide-hero">
          <div className="guide-hero-copy">
            <span className="eyebrow-label"><Sparkles size={12} /> OCCASSIA 2.0 OPERATOR GUIDE</span>
            <h2>From first invitation to gate check-in, in one clear flow.</h2>
            <p>Occassia manages personalized digital invitations, fast NFC gate access, and real-time attendance telemetry without losing the personal touch.</p>
            <div className="guide-hero-meta">
              <span><CheckCircle2 size={15} /> Digital invite &amp; RSVP suite</span>
              <span><Radio size={15} /> Sub-second NFC entrance</span>
            </div>
          </div>
          <div className="guide-orbit" aria-hidden="true">
            <div className="guide-orbit-ring guide-orbit-ring-one" />
            <div className="guide-orbit-ring guide-orbit-ring-two" />
            <div className="guide-orbit-core"><ScanLine size={34} /><span>Tap → verify</span></div>
            <span className="guide-orbit-node guide-orbit-node-one"><UsersRound size={16} /></span>
            <span className="guide-orbit-node guide-orbit-node-two"><CreditCard size={16} /></span>
            <span className="guide-orbit-node guide-orbit-node-three"><BarChart3 size={16} /></span>
          </div>
        </section>

        <section className="guide-flow-section" aria-labelledby="guide-flow-title">
          <div className="guide-section-heading">
            <div>
              <span className="eyebrow-label">THE OCCASSIA METHOD</span>
              <h3 id="guide-flow-title">Six seamless moves</h3>
            </div>
            <span className="guide-progress-label">
              {String(activeStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
            </span>
          </div>
          <div className="guide-stepper" role="tablist" aria-label="Occassia workflow steps">
            {steps.map((item, index) => {
              const StepIcon = item.icon;
              return (
                <button
                  key={item.number}
                  className={`guide-step-tab ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'complete' : ''}`}
                  onClick={() => setActiveStep(index)}
                  role="tab"
                  aria-selected={index === activeStep}
                >
                  <span className="guide-step-number">{index < activeStep ? <Check size={14} /> : item.number}</span>
                  <span className="guide-step-icon"><StepIcon size={15} /></span>
                  <span className="guide-step-tab-label">{item.title}</span>
                </button>
              );
            })}
          </div>
          <div className={`guide-detail-card tone-${step.tone}`} key={step.number}>
            <div className="guide-detail-icon"><Icon size={28} /></div>
            <div className="guide-detail-content">
              <span className="eyebrow-label">{step.eyebrow}</span>
              <h3>{step.title}</h3>
              <p className="guide-detail-lead">{step.description}</p>
              <p className="guide-detail-note">{step.detail}</p>
              {step.action && (
                <Link className="ops-button primary guide-action" to={step.action.to}>
                  {step.action.label} <ArrowRight size={15} />
                </Link>
              )}
            </div>
            <div className="guide-detail-controls">
              <button onClick={() => move(-1)} disabled={activeStep === 0} aria-label="Previous step">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => move(1)} disabled={activeStep === steps.length - 1} aria-label="Next step">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className="guide-nfc-grid">
          <div className="guide-nfc-card guide-nfc-primary">
            <div className="guide-card-icon"><Radio size={19} /></div>
            <div>
              <span className="eyebrow-label">PRIMARY ENTRY</span>
              <h3>NFC provides instant gate speed</h3>
              <p>Tap an NFC card or wristband on any supported Android phone or desktop USB reader. The UID is verified in under a second and registered in live gate logs.</p>
            </div>
            <div className="guide-signal"><span /><span /><span /></div>
          </div>
          <div className="guide-nfc-card guide-nfc-backup">
            <div className="guide-card-icon"><QrCode size={19} /></div>
            <div>
              <span className="eyebrow-label">BACKUP ENTRY</span>
              <h3>Digital QR pass keeps lines moving</h3>
              <p>When physical cards are forgotten, gate staff scan the guest’s digital QR ticket directly from their phone screen. Complete double-check rules apply.</p>
            </div>
            <div className="guide-qr-mark"><span /><span /><span /><span /></div>
          </div>
        </section>

        <section className="guide-role-section">
          <div className="guide-section-heading">
            <div>
              <span className="eyebrow-label">SECURITY & ROLES</span>
              <h3>Role-based permissions</h3>
            </div>
            <span className="guide-user-role">
              <CircleHelp size={14} /> Active: {user?.role?.replace('_', ' ') || 'Authenticated User'}
            </span>
          </div>
          <div className="guide-role-grid">
            {roles.map((role) => (
              <div className="guide-role-card" key={role.name}>
                <div className="guide-role-check"><Check size={13} /></div>
                <div>
                  <strong>{role.name}</strong>
                  <p>{role.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="guide-ready-card">
          <div>
            <span className="eyebrow-label">READY TO BEGIN</span>
            <h3>Start with an event, then let Occassia guide you.</h3>
            <p>You can return to this operator guide anytime from the workspace navigation.</p>
          </div>
          <Link to="/dashboard" className="ops-button primary">
            Open events dashboard <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}
