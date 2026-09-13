import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISSED_KEY = 'occassia-install-prompt-dismissed';

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !isStandalone();
}

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<DeferredInstallPrompt | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [iosInstall, setIosInstall] = useState(false);

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem(DISMISSED_KEY) === 'true') return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as DeferredInstallPrompt);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (isIos()) {
      setIosInstall(true);
      window.setTimeout(() => setVisible(true), 900);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent || installing) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') setVisible(false);
      setInstallEvent(null);
    } catch (error) {
      console.error('[PWA_INSTALL]', error);
    } finally {
      setInstalling(false);
    }
  };

  if (!visible) return null;

  return (
    <aside className="install-prompt" role="dialog" aria-label="Install Occassia">
      <div className="install-prompt-icon"><Download size={17} /></div>
      <div className="install-prompt-copy">
        <strong>Install Occassia</strong>
        {iosInstall
          ? <span>Use Share, then “Add to Home Screen” for faster access.</span>
          : <span>Keep event check-in close at hand and open it like an app.</span>}
      </div>
      {installEvent && <button className="install-prompt-action" type="button" onClick={install} disabled={installing}>{installing ? 'Installing…' : 'Install'}</button>}
      <button className="install-prompt-close" type="button" onClick={dismiss} aria-label="Dismiss install message"><X size={16} /></button>
    </aside>
  );
}
