import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, Compass, ExternalLink, MapPin, Menu, Search, Sparkles, Ticket, Users, X } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'https://event-80ny.onrender.com').replace(/\/$/, '');
const CATEGORIES = ['All events', 'Tech', 'Arts', 'Career', 'Campus Life', 'Sports'];
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85',
];

function getProfileId() {
  let id = localStorage.getItem('campus-pulse-user-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('campus-pulse-user-id', id); }
  return id;
}
function pick(event, keys, fallback = '') {
  for (const key of keys) if (event?.[key] !== undefined && event[key] !== null && event[key] !== '') return event[key];
  return fallback;
}
function eventTitle(event) { return pick(event, ['title', 'name', 'event_name'], 'Campus event'); }
function eventCategory(event) { return pick(event, ['category', 'type', 'event_type'], 'Campus Life'); }
function eventDate(event) { return pick(event, ['date', 'event_date', 'starts_at', 'start_date']); }
function formatDate(value) {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}
function friendlyError(error) { return error?.message || 'Something went wrong. Please try again.'; }

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function Brand() {
  return <a className="brand" href="#browse" aria-label="Campus Pulse home"><span className="brand-mark"><Sparkles size={20} strokeWidth={2.2} /></span><span><b>campus pulse</b><small>YOUR CAMPUS, IN MOTION</small></span></a>;
}

function Header({ view, setView, profileId, onProfileChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="topbar"><div className="topbar-inner"><Brand />
    <nav className={menuOpen ? 'nav nav-open' : 'nav'}>
      <button className={view === 'browse' ? 'nav-link active' : 'nav-link'} onClick={() => { setView('browse'); setMenuOpen(false); }}>Discover</button>
      <button className={view === 'registrations' ? 'nav-link active' : 'nav-link'} onClick={() => { setView('registrations'); setMenuOpen(false); }}>My tickets</button>
    </nav>
    <div className="top-actions"><button className="profile-chip" title={`Profile ID: ${profileId}. Click to change.`} onClick={onProfileChange}><span className="avatar">{profileId.slice(0, 1).toUpperCase()}</span><span className="profile-label">My profile</span><ChevronDown size={15} /></button><button className="mobile-menu" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
  </div></header>;
}

function EventCard({ event, index, onOpen, onRegister, busy, registered }) {
  const capacity = Number(pick(event, ['capacity', 'max_attendees', 'attendee_limit'], 0)) || 0;
  const count = Number(pick(event, ['registered_count', 'attendee_count', 'registration_count'], 0)) || 0;
  const remaining = capacity ? Math.max(0, capacity - count) : null;
  const venue = pick(event, ['venue', 'location', 'building'], 'Location to be announced');
  const date = eventDate(event);
  const status = String(pick(event, ['status'], 'Open'));
  const closed = !['open', 'active', 'published', ''].includes(status.toLowerCase()) || remaining === 0;
  const tags = pick(event, ['tags'], []);
  const fill = capacity ? Math.min(100, (count / capacity) * 100) : 0;
  return <article className="event-card">
    <div className="event-content"><div className="card-topline"><span className="image-tag">{eventCategory(event)}</span><span className={closed ? 'availability full' : 'availability'}><i />{closed ? 'Closed' : remaining !== null ? `${remaining} left` : 'Open'}</span></div>
      <button className="event-title" onClick={() => onOpen(event)}>{eventTitle(event)}</button>
      <div className="event-meta"><span><MapPin size={15} />{venue}</span><span><CalendarDays size={15} />{formatDate(date)}{pick(event, ['time', 'start_time'], '') && <> <Clock3 size={14} /> {pick(event, ['time', 'start_time'])}</>}</span></div>
      <div className="department">Dept: <b>{pick(event, ['department', 'organizer', 'host'], 'Campus Community')}</b></div>
      {Array.isArray(tags) && tags.length > 0 && <div className="event-tags">{tags.slice(0, 4).map((tag) => <span key={tag}>#{String(tag).replace(/^#/, '')}</span>)}</div>}
      <div className="capacity"><div><span>Capacity fill</span><b>{capacity ? `${count} / ${capacity} registered` : `${count} registered`}</b></div><div className="capacity-track"><span style={{ width: `${fill}%` }} /></div></div>
      <div className="event-footer"><button className="details-link" onClick={() => onOpen(event)}><Compass size={16} /> Details</button><button className={registered ? 'button button-registered' : 'button button-small'} disabled={busy || (closed && !registered)} onClick={() => onRegister(event)}>{busy ? 'Joining…' : registered ? <><Check size={16} /> Registered</> : <><Users size={15} /> Register</>}</button></div>
    </div>
  </article>;
}

function EventDialog({ event, onClose, onRegister, busy, registered }) {
  if (!event) return null;
  const date = eventDate(event);
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="event-modal" role="dialog" aria-modal="true" aria-label={eventTitle(event)}><button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button><div className="modal-photo"><img src={pick(event, ['image_url', 'image', 'cover_image', 'banner_url'], FALLBACK_IMAGES[0])} alt="" /></div><div className="modal-body"><span className="eyebrow">{eventCategory(event)} · {pick(event, ['department', 'organizer', 'host'], 'CAMPUS COMMUNITY')}</span><h2>{eventTitle(event)}</h2><div className="modal-facts"><span><CalendarDays />{formatDate(date)}{pick(event, ['time', 'start_time'], '') && ` · ${pick(event, ['time', 'start_time'])}`}</span><span><MapPin />{pick(event, ['venue', 'location', 'building'], 'Location to be announced')}</span></div><p>{pick(event, ['description', 'details', 'summary'], 'Join your campus community for this event.')}</p><div className="modal-bottom"><small><Users size={15} />{pick(event, ['capacity'], 'Open')} {event.capacity ? 'total spots' : 'for all students'}</small><button className={registered ? 'button button-registered' : 'button'} disabled={busy || registered} onClick={() => onRegister(event)}>{busy ? 'Joining…' : registered ? <><Check size={17} /> You’re going</> : <>Reserve my spot <ArrowRight size={17} /></>}</button></div></div></section></div>;
}

export default function App() {
  const [profileId, setProfileId] = useState(getProfileId);
  const [view, setView] = useState('browse');
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All events');
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState('');

  const loadEvents = async () => {
    setLoading(true); setError('');
    try { const result = await api('/api/events'); setEvents(Array.isArray(result) ? result : []); }
    catch (err) { setError(friendlyError(err)); }
    finally { setLoading(false); }
  };
  const loadRegistrations = async () => {
    setRegLoading(true); setError('');
    try { const result = await api(`/api/me/registrations?user_id=${encodeURIComponent(profileId)}`); setRegistrations(Array.isArray(result) ? result : []); }
    catch (err) { setError(friendlyError(err)); }
    finally { setRegLoading(false); }
  };
  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (view === 'registrations') loadRegistrations(); }, [view, profileId]);

  const changeProfile = () => {
    const value = window.prompt('Enter your profile UUID. A local demo UUID is used until you change it.', profileId);
    if (value === null) return;
    const normalized = value.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
      setNotice('Please enter a valid UUID for your profile.');
      return;
    }
    localStorage.setItem('campus-pulse-user-id', normalized);
    setProfileId(normalized);
    setRegistrations([]);
    setNotice('Profile updated. Your tickets will use this profile ID.');
  };

  const registeredIds = useMemo(() => new Set(registrations.map((item) => item.event_id || item.events?.id).filter(Boolean)), [registrations]);
  const filtered = useMemo(() => events.filter((event) => {
    const matchesCategory = category === 'All events' || eventCategory(event).toLowerCase() === category.toLowerCase();
    const haystack = [eventTitle(event), eventCategory(event), pick(event, ['venue', 'location']), pick(event, ['department', 'organizer']), pick(event, ['description'])].join(' ').toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  }), [events, category, query]);

  const register = async (event) => {
    const id = event.id;
    if (!id) { setNotice('This event is missing an ID, so registration is unavailable.'); return; }
    setBusyId(id); setNotice('');
    try {
      await api('/api/registrations', { method: 'POST', body: JSON.stringify({ user_id: profileId, event_id: id }) });
      setRegistrations((current) => [...current, { event_id: id, events: event }]);
      setNotice(`You’re on the list for ${eventTitle(event)}.`);
    } catch (err) { setNotice(friendlyError(err)); }
    finally { setBusyId(''); }
  };

  const registrationEvents = registrations.map((item) => item.events || events.find((event) => event.id === item.event_id)).filter(Boolean);
  return <><Header view={view} setView={setView} profileId={profileId} onProfileChange={changeProfile} />
    <main className="page-shell">
      {view === 'browse' ? <>
        <div className="api-strip"><div><span className="kicker-dot" /> <b>Campus event directory</b><span className="strip-note">Live data from the University Logistics API</span></div><span className="api-endpoint"><i /> GET /api/events {error ? '(offline)' : loading ? '(loading)' : '(connected)'}</span></div>
        <section className="hero"><div className="breadcrumb">DIRECTORY <span>/</span> CAMPUS CALENDAR <span>/</span> <b>ALL EVENTS</b></div><div className="hero-copy"><div><h1>Browse Campus Events</h1><p>Discover guest talks, creative meetups, career fairs, and campus traditions. Find the next thing that feels like you.</p></div><div className="hero-stats"><div><small>AVAILABLE EVENTS</small><b>{loading ? '—' : `${events.length} Events`}</b></div><div><small>YOUR REGISTRATIONS</small><b>{registeredIds.size} Tickets</b></div></div></div></section>
        <section className="events-section" id="events"><div className="filters"><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by event, venue, or department…" /><kbd>⌘ K</kbd></div><div className="category-row">{CATEGORIES.map((item) => <button key={item} className={category === item ? 'category active' : 'category'} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
          {notice && <div className="notice" role="status"><Check size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
          {error && <div className="error-panel"><div><b>We couldn’t reach the event list.</b><span>{error}</span></div><button className="button button-outline" onClick={loadEvents}>Try again</button></div>}
          {loading ? <div className="loading-grid">{[1, 2, 3].map((n) => <div className="skeleton" key={n} />)}</div> : filtered.length ? <div className="event-grid">{filtered.map((event, index) => <EventCard key={event.id || index} event={event} index={index} onOpen={setSelected} onRegister={register} busy={busyId === event.id} registered={registeredIds.has(event.id)} />)}</div> : !error && <div className="empty-state"><span className="empty-icon"><Compass /></span><h3>No events found (yet)</h3><p>Try another search or category. There’s always something around the corner.</p><button className="button button-outline" onClick={() => { setCategory('All events'); setQuery(''); }}>Clear filters</button></div>}
        </section>
      </> : <section className="registrations-page"><button className="back-link" onClick={() => setView('browse')}><ArrowLeft size={16} /> Back to discover</button><div className="section-kicker">YOUR CAMPUS PLANS</div><h1>My tickets<span className="title-period">.</span></h1><p className="registrations-lede">All the good things you’ve said yes to.</p>{notice && <div className="notice"><Check size={17} />{notice}</div>}{error && <div className="error-panel"><div><b>Couldn’t load your tickets.</b><span>{error}</span></div><button className="button button-outline" onClick={loadRegistrations}>Try again</button></div>}{regLoading ? <div className="loading-grid">{[1, 2].map((n) => <div className="skeleton" key={n} />)}</div> : registrationEvents.length ? <div className="event-grid">{registrationEvents.map((event, index) => <EventCard key={event.id || index} event={event} index={index} onOpen={setSelected} onRegister={register} busy={busyId === event.id} registered />)}</div> : !error && <div className="empty-state"><span className="empty-icon"><Ticket /></span><h3>Your next yes is out there.</h3><p>You haven’t registered for an event yet. Find one that feels like you.</p><button className="button" onClick={() => setView('browse')}>Explore events <ArrowRight size={16} /></button></div>}</section>}
    </main>
    <footer className="footer"><Brand /><span>Made for all the moments that make campus, campus.</span><a href={`${API_URL}/`} target="_blank" rel="noreferrer">API status <ExternalLink size={14} /></a></footer>
    <EventDialog event={selected} onClose={() => setSelected(null)} onRegister={register} busy={busyId === selected?.id} registered={registeredIds.has(selected?.id)} />
  </>;
}
