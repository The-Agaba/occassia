import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { cardsApi } from '../api';
import EventTabs from '../components/EventTabs';
import NfcCapture from '../components/NfcCapture';
import { useUiStore } from '../store/uiStore';

export default function CardRegistrationPage() {
  const { id } = useParams<{ id: string }>(); const [uid, setUid] = useState(''); const [saving, setSaving] = useState(false); const [success, setSuccess] = useState(''); const showToast = useUiStore((s) => s.showToast);
  const appendUid = (value: string) => {
    const captured = value.trim();
    if (!captured) return;
    const existing = uid.split(',').map((item) => item.trim()).filter(Boolean);
    if (existing.some((item) => item.toUpperCase() === captured.toUpperCase())) {
      showToast(`Card ${captured} is already in the registration list.`, 'info');
      return;
    }
    setUid([...existing, captured].join(', '));
    setSuccess('');
  };
  const register = async () => {
    const values = Array.from(new Set(uid.split(',').map((item) => item.trim()).filter(Boolean)));
    if (values.length === 0) { showToast('Capture or enter at least one card UID before registering.', 'error'); return; }
    setSaving(true); setSuccess('');
    if (!id) return;
    const results = await Promise.allSettled(values.map((value) => cardsApi.register(id, value)));
    const failed = values.filter((_, index) => results[index].status === 'rejected');
    const registered = values.length - failed.length;
    setSaving(false);
    if (failed.length === 0) {
      setUid('');
      setSuccess(`${registered} card${registered === 1 ? '' : 's'} registered and ready for assignment.`);
      showToast(`${registered} NFC card${registered === 1 ? '' : 's'} registered successfully.`, 'success');
      return;
    }
    setUid(failed.join(', '));
    const message = registered > 0
      ? `${registered} card${registered === 1 ? '' : 's'} registered. ${failed.length} failed and remain in the list for retry.`
      : 'No cards were registered. The captured UIDs remain in the list for retry.';
    setSuccess(message);
    showToast(message, 'error');
    results.forEach((result, index) => { if (result.status === 'rejected') { console.error('[Cards] Registration failed', { uid: values[index], error: result.reason }); const reason = result.reason?.response?.data?.message; if (reason) showToast(`${values[index]}: ${reason}`, 'error'); } });
  };
  return <div className="ops-page"><EventTabs /><div className="ops-page-inner narrow"><Link to={`/events/${id}/cards`} className="back-link"><ArrowLeft size={16} /> Card inventory</Link><div className="ops-page-heading compact"><div><span className="eyebrow-label">CARD CONTROL / 01</span><h2>Register NFC cards</h2><p>Tap multiple cards or enter UIDs separated by commas, then register them together.</p></div><CreditCard className="heading-mark" /></div><div className="ops-two-column"><NfcCapture onUid={appendUid} disabled={saving} label="Capture card UIDs" /><section className="ops-panel form-panel"><span className="eyebrow-label">CONFIRM DETAILS</span><h3>Ready to register?</h3><p className="panel-help">Each captured UID is appended to the list. Review it before registering the batch.</p><label className="ops-label" htmlFor="registration-uid">Card UIDs</label><input id="registration-uid" className="ops-input mono" value={uid} onChange={(e) => setUid(e.target.value)} placeholder="04:A3:FF:12:BC, 04:B7:01:44:9A" disabled={saving} /><button type="button" className="ops-button primary full" disabled={saving || !uid.trim()} onClick={register}>{saving ? 'Registering cards…' : 'Register cards'}</button>{success && <div className="success-message"><CheckCircle2 size={18} />{success}</div>}</section></div></div></div>;
}
