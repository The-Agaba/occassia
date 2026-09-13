import { ArrowRight, CheckCircle2, CreditCard, Radio, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeProvider';
import SEO from '../components/SEO';
import { publicApi } from '../api';

const features = [
  { icon: Radio, title: 'Tap-first entry', text: 'Use Web NFC or a connected reader to move guests through the gate in seconds.' },
  { icon: QrCode, title: 'A reliable backup', text: 'Every guest has a unique QR token for a graceful fallback when NFC is unavailable.' },
  { icon: CreditCard, title: 'Cards that stay in sync', text: 'Register cards, assign them to eligible guests, and keep the live event view current.' },
];

export default function LandingPage() {
  const [totalCheckIns, setTotalCheckIns] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    publicApi.metrics()
      .then(({ data }) => {
        if (active) setTotalCheckIns(data.totalCheckIns);
      })
      .catch((error) => {
        console.error('[LANDING_METRICS]', error);
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="landing-shell">
      <SEO title="Occassia | Event guest access, NFC check-in and live attendance" description="Occassia helps event teams welcome guests, manage NFC cards, use QR backups, and monitor attendance in real time." keywords="event guest access, NFC check-in, QR event check-in, guest management, Cotronix" />
      <nav className="landing-nav">
        <Link to="/" className="brand-lockup"><img src="/new-favicon.svg" alt="Occassia logo" /><span>Occassia</span></Link>
        <div className="landing-nav-links"><Link to="/about">About</Link><Link to="/terms">Terms</Link><ThemeToggle /><Link className="landing-login" to="/login">Sign in <ArrowRight size={16} /></Link></div>
      </nav>
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> THE GUEST EXPERIENCE PLATFORM</div>
          <h1>Every arrival,<br /><em>beautifully handled.</em></h1>
          <p>Occassia gives event teams a calm, connected way to welcome guests, manage cards, and see attendance unfold in real time.</p>
          <div className="hero-actions"><Link to="/login" className="hero-primary">Enter the platform <ArrowRight size={17} /></Link><a href="#how-it-works" className="hero-secondary">See how it works</a></div>
          <div className="hero-proof"><CheckCircle2 size={16} /> Built for weddings, venues, and high-volume entrances</div>
        </div>
        <div className="hero-visual" aria-label="Abstract event access illustration">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="visual-orbit orbit-three" />
          <div className="visual-card"><div className="visual-card-top"><span className="status-dot" /> LIVE GATE</div><div className="visual-scan-ring"><Radio size={64} strokeWidth={1.2} /></div><strong>Tap to welcome</strong><span>Secure · instant · human</span></div>
          <div className="visual-float float-top"><ShieldCheck size={16} /><span>Verified guest</span></div><div className="visual-float float-bottom"><span className="mini-avatar">A</span><span>{totalCheckIns === null ? 'Loading live count…' : `+ ${totalCheckIns.toLocaleString()} checked in`}</span></div>
        </div>
      </section>
      <section id="how-it-works" className="feature-grid"><div className="section-intro"><span>01 / OPERATIONS</span><h2>One clear view<br />of the whole welcome.</h2></div>{features.map(({ icon: Icon, title, text }) => <article className="feature-card" key={title}><div className="feature-icon"><Icon size={20} /></div><h3>{title}</h3><p>{text}</p></article>)}</section>
      <footer className="landing-footer"><span>© {new Date().getFullYear()} Cotronix · Occassia</span><span>Designed by Agaba</span><div><Link to="/about">About us</Link><Link to="/terms">Terms & conditions</Link></div></footer>
    </main>
  );
}
