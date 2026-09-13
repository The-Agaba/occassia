import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  useEffect(() => {
    const wentOffline = () => { setOffline(true); console.warn('[NETWORK] Browser is offline'); };
    const cameOnline = () => { setOffline(false); console.info('[NETWORK] Connection restored'); };
    window.addEventListener('offline', wentOffline); window.addEventListener('online', cameOnline);
    return () => { window.removeEventListener('offline', wentOffline); window.removeEventListener('online', cameOnline); };
  }, []);
  return offline ? <div className="network-status" role="alert"><WifiOff size={16} /> No internet connection. Changes will not be submitted until you reconnect.</div> : null;
}
