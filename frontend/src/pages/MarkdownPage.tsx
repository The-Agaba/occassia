import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeProvider';
import terms from '../content/terms.md?raw';
import about from '../content/about.md?raw';

function renderMarkdown(source: string) {
  return source.split('\n').map((line, index) => {
    if (line.startsWith('# ')) return <h1 key={index}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith('- ')) return <li key={index}>{line.slice(2)}</li>;
    if (!line.trim()) return <div className="md-space" key={index} />;
    return <p key={index}>{line}</p>;
  });
}

export default function MarkdownPage({ kind }: { kind: 'about' | 'terms' }) {
  const source = kind === 'about' ? about : terms;
  return <main className="markdown-shell"><nav className="landing-nav"><Link to="/" className="brand-lockup"><img src="/new-favicon.svg" alt="Occassia logo" /><span>Occassia</span></Link><div className="landing-nav-links"><ThemeToggle /><Link to="/login" className="landing-login">Sign in</Link></div></nav><article className="markdown-card"><Link className="back-link" to="/"><ArrowLeft size={16} /> Back home</Link><div className="markdown-content">{renderMarkdown(source)}</div></article></main>;
}
