import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { cardsApi } from '../api';
import EventTabs from '../components/EventTabs';
import NfcCapture from '../components/NfcCapture';
import { useUiStore } from '../store/uiStore';

export default function CardRegistrationPage() {
  const { id } = useParams<{ id: string }>(); const [uid, setUid] = useState(''); const [saving, setSaving] = useState(false); const [success, setSuccess] = useState(''); const showToast = useUiStore((s) => s.showToast);
  const register = async () => { if (!uid.trim()) { showToast('Capture or enter a card UID before registering.', 'error'); return; } setSaving(true); setSuccess(''); try { await cardsApi.register(uid.trim()); setSuccess(`Card ${uid.trim()} is registered and ready for assignment.`); setUid(''); showToast('NFC card registered successfully.', 'success'); } catch (err: any) { console.error('[Cards] Registration failed', err); showToast(err.response?.data?.message || 'This card could not be registered. Confirm the UID is valid and not already registered.', 'error'); } finally { setSaving(false); } };
  return <div className="ops-page"><EventTabs /><div className="ops-page-inner narrow"><Link to={`/events/${id}/cards`} className="back-link"><ArrowLeft size={16} /> Card inventory</Link><div className="ops-page-heading compact"><div><span className="eyebrow-label">CARD CONTROL / 01</span><h2>Register an NFC card</h2><p>Capture a card UID without leaving this workflow, then add it to the organization inventory.</p></div><CreditCard className="heading-mark" /></div><div className="ops-two-column"><NfcCapture onUid={(value) => { setUid(value); setSuccess(''); }} disabled={saving} label="Capture card UID" /><section className="ops-panel form-panel"><span className="eyebrow-label">CONFIRM DETAILS</span><h3>Ready to register?</h3><p className="panel-help">Review the UID returned by the phone or external reader. The system stores the normalized UID only.</p><label className="ops-label" htmlFor="registration-uid">Card UID</label><input id="registration-uid" className="ops-input mono" value={uid} onChange={(e) => setUid(e.target.value)} placeholder="04:A3:FF:12:BC" disabled={saving} /><button type="button" className="ops-button primary full" disabled={saving || !uid.trim()} onClick={register}>{saving ? 'Registering…' : 'Register card'}</button>{success && <div className="success-message"><CheckCircle2 size={18} />{success}</div>}</section></div></div></div>;
}
