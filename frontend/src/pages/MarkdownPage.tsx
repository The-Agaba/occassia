import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, ExternalLink, Mail, MessageCircle } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeProvider';
import SEO from '../components/SEO';
import terms from '../content/terms.md?raw';
import about from '../content/about.md?raw';

function renderMarkdown(source: string) {
  const renderInline = (text: string) => {
    const match = text.match(/^\[([^\]]+)\]\(([^)]+)\)(.*)$/);
    if (!match) return text;
    const [, label, href, suffix] = match;
    const Icon = label.toLowerCase().includes('github') ? Code2 : label.toLowerCase().includes('whatsapp') ? MessageCircle : label.toLowerCase().includes('email') ? Mail : ExternalLink;
    return <><a className="markdown-link" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}><Icon size={15} />{label}</a>{suffix}</>;
  };
  return source.split('\n').map((line, index) => {
    if (line.startsWith('# ')) return <h1 key={index}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith('- ')) return <li key={index}>{renderInline(line.slice(2))}</li>;
    if (!line.trim()) return <div className="md-space" key={index} />;
    return <p key={index}>{renderInline(line)}</p>;
  });
}

export default function MarkdownPage({ kind }: { kind: 'about' | 'terms' }) {
  const source = kind === 'about' ? about : terms;
  return <main className="markdown-shell"><SEO title={kind === 'about' ? 'About Cotronix | Occassia' : 'Terms and Conditions | Occassia'} description={kind === 'about' ? 'Learn about Cotronix, the team behind Occassia, and how to contact the creator.' : 'Read the Occassia terms and conditions for event access, NFC, QR check-in, and guest data use.'} keywords={kind === 'about' ? 'Cotronix, Occassia, Agaba, event technology' : 'Occassia terms, NFC check-in terms, event platform terms'} /><nav className="landing-nav"><Link to="/" className="brand-lockup"><img src="/new-favicon.svg" alt="Occassia logo" /><span>Occassia</span></Link><div className="landing-nav-links"><ThemeToggle /><Link to="/login" className="landing-login">Sign in</Link></div></nav><article className="markdown-card"><Link className="back-link" to="/"><ArrowLeft size={16} /> Back home</Link><div className="markdown-content">{renderMarkdown(source)}</div></article></main>;
}
