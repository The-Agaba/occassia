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
    description: 'Create one workspace for the occasion, then add the details your team needs at the entrance.',
    detail: 'Add the date, venue, guest categories, and gates. Move the event from Draft to Active when you are ready to welcome people.',
    icon: Gauge,
    tone: 'violet',
    action: { label: 'Open events', to: '/dashboard' },
  },
  {
    number: '02',
    title: 'Bring in your guests',
    eyebrow: 'BUILD THE LIST',
    description: 'Create guests one by one or import a prepared list, then confirm and mark payment status as your workflow requires.',
    detail: 'Categories make it easy to identify guests at a glance. Every guest also receives a QR token that can be used as the backup check-in method.',
    icon: UsersRound,
    tone: 'cyan',
    action: { label: 'Choose an event', to: '/dashboard' },
  },
  {
    number: '03',
    title: 'Prepare NFC access',
    eyebrow: 'CARD CONTROL',
    description: 'Register each NFC card by its hardware UID, then assign it to an eligible confirmed and paid guest.',
    detail: 'A card UID is the card’s identity. Occassia accepts it from a phone tap, external NFC reader, or serial bridge and normalizes the format automatically.',
    icon: CreditCard,
    tone: 'gold',
    action: { label: 'Open card control', to: '/card-control' },
  },
  {
    number: '04',
    title: 'Check guests in',
    eyebrow: 'AT THE GATE',
    description: 'Use the phone’s built-in NFC reader or an external NFC reader. The card UID is captured and checked automatically.',
    detail: 'If NFC is unavailable, switch to QR Backup and scan the guest’s QR code. There is no manual guest-ID check-in path in the gate workflow.',
    icon: Radio,
    tone: 'violet',
    action: { label: 'Open an event', to: '/dashboard' },
  },
  {
    number: '05',
    title: 'Watch the room live',
    eyebrow: 'STAY IN CONTROL',
    description: 'Follow check-ins as they happen, see attendance totals, and use reports for a clean event wrap-up.',
    detail: 'The live view updates for your team, while the audit trail records the operational history for authorized administrators.',
    icon: BarChart3,
    tone: 'cyan',
    action: { label: 'Open events', to: '/dashboard' },
  },
];

const roles = [
  { name: 'Admin', text: 'Full setup, team, card, and reporting control.' },
  { name: 'Event manager', text: 'Prepare events, guests, cards, and gates.' },
  { name: 'Check-in staff', text: 'Run the entrance smoothly with NFC and QR.' },
  { name: 'Viewer', text: 'See operational information without changing it.' },
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
            <span className="eyebrow-label"><Sparkles size={12} /> OCCASSIA QUICK START</span>
            <h2>From first guest to final report, in one clear flow.</h2>
            <p>Occassia helps event teams prepare access, move guests through the gate, and keep a live view of attendance without losing the human touch.</p>
            <div className="guide-hero-meta"><span><CheckCircle2 size={15} /> Built for busy event teams</span><span><Radio size={15} /> NFC first, QR backup</span></div>
          </div>
          <div className="guide-orbit" aria-hidden="true">
            <div className="guide-orbit-ring guide-orbit-ring-one" />
            <div className="guide-orbit-ring guide-orbit-ring-two" />
            <div className="guide-orbit-core"><ScanLine size={34} /><span>Tap → confirm</span></div>
            <span className="guide-orbit-node guide-orbit-node-one"><UsersRound size={16} /></span>
            <span className="guide-orbit-node guide-orbit-node-two"><CreditCard size={16} /></span>
            <span className="guide-orbit-node guide-orbit-node-three"><BarChart3 size={16} /></span>
          </div>
        </section>

        <section className="guide-flow-section" aria-labelledby="guide-flow-title">
          <div className="guide-section-heading"><div><span className="eyebrow-label">THE OCCASSIA METHOD</span><h3 id="guide-flow-title">Five simple moves</h3></div><span className="guide-progress-label">{String(activeStep + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span></div>
          <div className="guide-stepper" role="tablist" aria-label="Occassia workflow steps">
            {steps.map((item, index) => {
              const StepIcon = item.icon;
              return <button key={item.number} className={`guide-step-tab ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'complete' : ''}`} onClick={() => setActiveStep(index)} role="tab" aria-selected={index === activeStep}>
                <span className="guide-step-number">{index < activeStep ? <Check size={14} /> : item.number}</span><span className="guide-step-icon"><StepIcon size={15} /></span><span className="guide-step-tab-label">{item.title}</span>
              </button>;
            })}
          </div>
          <div className={`guide-detail-card tone-${step.tone}`} key={step.number}>
            <div className="guide-detail-icon"><Icon size={28} /></div>
            <div className="guide-detail-content"><span className="eyebrow-label">{step.eyebrow}</span><h3>{step.title}</h3><p className="guide-detail-lead">{step.description}</p><p className="guide-detail-note">{step.detail}</p>{step.action && <Link className="ops-button primary guide-action" to={step.action.to}>{step.action.label} <ArrowRight size={15} /></Link>}</div>
            <div className="guide-detail-controls"><button onClick={() => move(-1)} disabled={activeStep === 0} aria-label="Previous step"><ChevronLeft size={18} /></button><button onClick={() => move(1)} disabled={activeStep === steps.length - 1} aria-label="Next step"><ChevronRight size={18} /></button></div>
          </div>
        </section>

        <section className="guide-nfc-grid">
          <div className="guide-nfc-card guide-nfc-primary"><div className="guide-card-icon"><Radio size={19} /></div><div><span className="eyebrow-label">PRIMARY CHECK-IN</span><h3>NFC does the fast work</h3><p>Tap a card on the back of a supported phone, or use an external NFC reader. The card UID is captured automatically and sent to the guest check-in flow.</p></div><div className="guide-signal"><span /><span /><span /></div></div>
          <div className="guide-nfc-card guide-nfc-backup"><div className="guide-card-icon"><QrCode size={19} /></div><div><span className="eyebrow-label">BACKUP CHECK-IN</span><h3>QR keeps the line moving</h3><p>When NFC is unavailable, scan the guest QR code. QR is the backup path; the same event and attendance rules still apply.</p></div><div className="guide-qr-mark"><span /><span /><span /><span /></div></div>
        </section>

        <section className="guide-role-section"><div className="guide-section-heading"><div><span className="eyebrow-label">YOUR ACCESS</span><h3>What you can do here</h3></div><span className="guide-user-role"><CircleHelp size={14} /> {user?.role?.replace('_', ' ') || 'Workspace user'}</span></div><div className="guide-role-grid">{roles.map((role) => <div className="guide-role-card" key={role.name}><div className="guide-role-check"><Check size={13} /></div><div><strong>{role.name}</strong><p>{role.text}</p></div></div>)}</div></section>

        <section className="guide-ready-card"><div><span className="eyebrow-label">READY WHEN YOU ARE</span><h3>Start with an event, then let the flow guide you.</h3><p>Keep this guide open while your team sets up. You can return here anytime from the sidebar.</p></div><Link to="/dashboard" className="ops-button primary">Go to events <ArrowRight size={16} /></Link></section>
      </div>
    </div>
  );
}
