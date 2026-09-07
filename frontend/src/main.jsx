import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'medflow_access_token';

const icons = {
  grid: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  users: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  plus: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>,
  search: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>,
  calendar: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  activity: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>,
  arrow: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  edit: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>,
  trash: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" /></svg>,
  close: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>,
  logout: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6" /></svg>,
  chevron: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>,
  check: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>,
};

async function apiRequest(path, options = {}, token = null) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof body === 'string' ? body : body?.message || Object.values(body || {})[0];
    throw new Error(detail || `La requête a échoué (${response.status}).`);
  }
  return body;
}

function decodeToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'P';
}

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      onLogin(data.token);
    } catch (requestError) {
      setError(requestError.message === 'Failed to fetch' ? 'La gateway est inaccessible. Vérifiez que le backend est démarré.' : 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className="auth-visual">
        <div className="brand brand-light"><span className="brand-mark">✦</span><span>med<span>flow</span></span></div>
        <div className="visual-copy">
          <p className="eyebrow">Gestion médicale nouvelle génération</p>
          <h1>Chaque patient mérite un suivi plus humain.</h1>
          <p>Centralisez vos informations, simplifiez votre quotidien et gardez une longueur d’avance sur chaque parcours de soin.</p>
        </div>
        <div className="trust-note"><span className="trust-icon">✓</span><span>Données sécurisées et accès réservé à votre équipe</span></div>
      </section>
      <section className="auth-panel">
        <div className="mobile-brand brand"><span className="brand-mark">✦</span><span>med<span>flow</span></span></div>
        <div className="auth-form-wrap">
          <p className="eyebrow">Bon retour</p>
          <h2>Connectez-vous à votre espace</h2>
          <p className="muted auth-intro">Retrouvez vos patients et votre activité en un clin d’œil.</p>
          <form onSubmit={submit} className="auth-form">
            <label>Email professionnel<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="vous@clinique.fr" required autoComplete="email" /></label>
            <label>Mot de passe<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" minLength="8" required autoComplete="current-password" /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="button button-primary button-wide" disabled={loading}>{loading ? 'Connexion…' : 'Ouvrir mon espace'} <span>{icons.arrow}</span></button>
          </form>
          <p className="auth-footnote">Besoin d'aide ? Contactez votre administrateur.</p>
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon, label, value, detail, tone }) {
  return <article className={`stat-card ${tone}`}><div className="stat-icon">{icon}</div><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></article>;
}

function PatientAvatar({ name, small = false }) {
  return <div className={`avatar ${small ? 'avatar-small' : ''}`}>{initials(name)}</div>;
}

function PatientTable({ patients, onEdit, onDelete, compact = false }) {
  if (!patients.length) return <div className="empty-state"><div className="empty-icon">{icons.users}</div><h3>Aucun patient trouvé</h3><p>Ajoutez votre premier patient pour commencer à suivre votre activité.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>Patient</th><th>Email</th><th>Date de naissance</th><th>Adresse</th>{!compact && <th className="actions-heading">Actions</th>}</tr></thead><tbody>{patients.map((patient) => <tr key={patient.id}><td><div className="patient-cell"><PatientAvatar name={patient.name} small /><div><strong>{patient.name}</strong><span>ID · {patient.id?.slice(0, 8) || '—'}</span></div></div></td><td className="email-cell">{patient.email}</td><td>{formatDate(patient.dateOfBirth)}</td><td className="address-cell">{patient.address}</td>{!compact && <td><div className="row-actions"><button className="icon-button" title="Modifier" onClick={() => onEdit(patient)}>{icons.edit}</button><button className="icon-button danger" title="Supprimer" onClick={() => onDelete(patient)}>{icons.trash}</button></div></td>}</tr>)}</tbody></table></div>;
}

function PatientModal({ patient, onClose, onSaved }) {
  const editing = Boolean(patient);
  const [form, setForm] = useState({ name: patient?.name || '', email: patient?.email || '', address: patient?.address || '', dateOfBirth: patient?.dateOfBirth || '', registeredDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setError(''); setSaving(true);
    try {
      const data = await apiRequest(editing ? `/api/patients/${patient.id}` : '/api/patients', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) }, localStorage.getItem(TOKEN_KEY));
      onSaved(data, editing ? 'Patient mis à jour.' : 'Patient ajouté avec succès.');
    } catch (requestError) { setError(requestError.message === 'Failed to fetch' ? 'Impossible de joindre le serveur.' : requestError.message); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="patient-modal-title"><div className="modal-head"><div><p className="eyebrow">Dossier patient</p><h2 id="patient-modal-title">{editing ? 'Modifier le patient' : 'Nouveau patient'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer">{icons.close}</button></div><form onSubmit={submit}><div className="form-grid"><label>Nom complet<input name="name" value={form.name} onChange={change} placeholder="Ex. Sofia Martin" maxLength="100" required /></label><label>Email<input type="email" name="email" value={form.email} onChange={change} placeholder="sofia@email.com" required /></label><label>Date de naissance<input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={change} required /></label><label className="full-field">Adresse<input name="address" value={form.address} onChange={change} placeholder="12 rue des Lilas, Casablanca" required /></label></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Annuler</button><button className="button button-primary" disabled={saving}>{saving ? 'Enregistrement…' : editing ? 'Enregistrer les changements' : 'Ajouter le patient'}</button></div></form></section></div>;
}

function AppShell({ token, onLogout }) {
  const [view, setView] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [query, setQuery] = useState('');
  const [modalPatient, setModalPatient] = useState(undefined);
  const [toast, setToast] = useState('');
  const claims = decodeToken(token);

  async function loadPatients() {
    setLoading(true); setFetchError('');
    try { setPatients(await apiRequest('/api/patients', {}, token) || []); }
    catch (error) { if (error.message.includes('401')) onLogout(); else setFetchError(error.message === 'Failed to fetch' ? 'La gateway est inaccessible.' : error.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadPatients(); }, []);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);

  const filtered = useMemo(() => patients.filter((patient) => `${patient.name} ${patient.email} ${patient.address}`.toLowerCase().includes(query.toLowerCase())), [patients, query]);
  const adults = patients.filter((patient) => {
    const birth = new Date(`${patient.dateOfBirth}T00:00:00`); return !Number.isNaN(birth.getTime()) && ((Date.now() - birth.getTime()) / 31557600000) >= 18;
  }).length;
  const monthPatients = patients.filter((patient) => patient.dateOfBirth && patient.dateOfBirth.slice(0, 7) === new Date().toISOString().slice(0, 7)).length;
  const userEmail = claims.sub || 'Administrateur';
  const todayLabel = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  async function deletePatient(patient) {
    if (!window.confirm(`Supprimer le dossier de ${patient.name} ?`)) return;
    try { await apiRequest(`/api/patients/${patient.id}`, { method: 'DELETE' }, token); setPatients((items) => items.filter((item) => item.id !== patient.id)); setToast('Patient supprimé.'); }
    catch (error) { setToast(error.message); }
  }
  function savedPatient(data, message) { setPatients((items) => data ? (items.some((item) => item.id === data.id) ? items.map((item) => item.id === data.id ? data : item) : [data, ...items]) : items); setModalPatient(undefined); setToast(message); }

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">✦</span><span>med<span>flow</span></span></div><div className="sidebar-label">Espace de travail</div><nav><button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>{icons.grid}<span>Vue d'ensemble</span></button><button className={view === 'patients' ? 'active' : ''} onClick={() => setView('patients')}>{icons.users}<span>Patients</span><b>{patients.length}</b></button></nav><div className="sidebar-bottom"><div className="support-card"><span className="support-dot" /><div><strong>Système opérationnel</strong><small>Vos services fonctionnent normalement</small></div></div><div className="profile"><div className="profile-avatar">{initials(userEmail)}</div><div className="profile-copy"><strong>{userEmail.split('@')[0]}</strong><span>{claims.role || 'ADMIN'}</span></div><button className="icon-button logout-button" onClick={onLogout} title="Se déconnecter">{icons.logout}</button></div></div></aside><main className="main-content"><header className="topbar"><div><p className="breadcrumb">MedFlow <span>/</span> {view === 'dashboard' ? 'Vue d’ensemble' : 'Patients'}</p><h1>{view === 'dashboard' ? 'Bonjour, bienvenue.' : 'Patients'}</h1></div><div className="topbar-actions"><div className="status-pill"><span /> Synchronisé</div><button className="button button-primary" onClick={() => setModalPatient(null)}>{icons.plus}<span>Nouveau patient</span></button></div></header>{view === 'dashboard' ? <><section className="welcome-row"><div><p className="muted">Voici ce qui se passe dans votre espace aujourd'hui.</p></div><button className="date-filter">{icons.calendar} {todayLabel} {icons.chevron}</button></section><section className="stat-grid"><StatCard icon={icons.users} label="Total patients" value={patients.length} detail="Dossiers enregistrés" tone="blue" /><StatCard icon={icons.activity} label="Patients majeurs" value={adults} detail="Calcul basé sur la date de naissance" tone="mint" /><StatCard icon={icons.calendar} label="Anniversaires ce mois" value={monthPatients} detail="Date de naissance ce mois" tone="peach" /></section><section className="section-heading"><div><p className="eyebrow">Activité récente</p><h2>Derniers patients</h2></div><button className="text-button" onClick={() => setView('patients')}>Voir tous les patients {icons.arrow}</button></section><section className="panel">{loading ? <Loading /> : fetchError ? <ErrorState message={fetchError} onRetry={loadPatients} /> : <PatientTable patients={patients.slice(0, 5)} compact onEdit={() => {}} onDelete={() => {}} />}</section></> : <><section className="page-toolbar"><div className="search-box">{icons.search}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par nom, email ou adresse…" /></div><span className="result-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span></section><section className="panel">{loading ? <Loading /> : fetchError ? <ErrorState message={fetchError} onRetry={loadPatients} /> : <PatientTable patients={filtered} onEdit={setModalPatient} onDelete={deletePatient} />}</section></>}</main>{modalPatient !== undefined && <PatientModal patient={modalPatient} onClose={() => setModalPatient(undefined)} onSaved={savedPatient} />}{toast && <div className="toast">{icons.check}<span>{toast}</span></div>}</div>;
}

function Loading() { return <div className="loading-state"><span className="spinner" /> Chargement des patients…</div>; }
function ErrorState({ message, onRetry }) { return <div className="empty-state"><div className="empty-icon error-icon">!</div><h3>Impossible de charger les données</h3><p>{message}</p><button className="button button-secondary" onClick={onRetry}>Réessayer</button></div>; }

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  function login(value) { localStorage.setItem(TOKEN_KEY, value); setToken(value); }
  function logout() { localStorage.removeItem(TOKEN_KEY); setToken(null); }
  return token ? <AppShell token={token} onLogout={logout} /> : <Login onLogin={login} />;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
