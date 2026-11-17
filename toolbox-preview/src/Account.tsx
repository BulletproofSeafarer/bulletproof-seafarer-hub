import { ArrowLeft, ArrowDownToLine, BarChart3, Bell, ChevronRight, FileBadge2, Ship, UserRound } from 'lucide-react';
import { formatDate, type MaritimeCV } from './cv';
import { dateOffset, types, type Data, type Service } from './storage';

export type AccountPage = 'overview' | 'statistics' | 'service' | 'cv';

const links = [
  { key: 'statistics', title: 'Statistics', icon: BarChart3 },
  { key: 'service', title: 'Sea Service', icon: Ship },
  { key: 'cv', title: 'Maritime CV', icon: FileBadge2 },
  { key: 'reminders', title: 'Reminders', icon: Bell }
] as const;

const day = (date: string) => Date.parse(date + 'T00:00:00Z') / 86_400_000;

function loggedDays(services: Service[]) {
  const today = dateOffset();
  const ranges = services.map(item => [day(item.start), day(item.end || today)] as const)
    .filter(([start, end]) => Number.isFinite(start) && start <= end)
    .sort(([a], [b]) => a - b);
  let count = 0;
  let countedThrough = -Infinity;
  for (const [start, end] of ranges) {
    count += Math.max(0, end - Math.max(start, countedThrough + 1) + 1);
    countedThrough = Math.max(countedThrough, end);
  }
  return count;
}

type Props = {
  page: AccountPage;
  data: Data;
  cv: MaritimeCV;
  exporting: boolean;
  onPage: (page: AccountPage) => void;
  onReminders: () => void;
  onService: (id?: string) => void;
  onDownload: () => void;
  onCertificate: (id: string) => void;
};

export function Account({ page, data, cv, exporting, onPage, onReminders, onService, onDownload, onCertificate }: Props) {
  const { profile, services } = cv;
  const vessels = new Set(services.map(item => item.vessel.trim().toLowerCase()).filter(Boolean)).size;
  const days = loggedDays(services);
  const metrics = [
    { label: 'Days at sea', value: days },
    { label: 'Service records', value: services.length },
    { label: 'Vessels', value: vessels }
  ];
  const initials = profile.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase();
  const selected = links.find(link => link.key === page);

  if (page === 'overview') return <div className="account-view">
    <section className="account-identity" aria-label="Crew profile">
      <div className="account-avatar" aria-hidden="true">{initials || <UserRound size={30} />}</div>
      <div><h1>{profile.name || 'Your profile'}</h1>{profile.rank && <p>{profile.rank}</p>}</div>
    </section>
    {profile.summary && <p className="account-summary">{profile.summary}</p>}
    <dl className="account-metrics">{metrics.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value.toLocaleString()}</dd></div>)}</dl>
    <div className="account-shortcuts" aria-label="Account shortcuts">
      {links.map(({ key, title, icon: Icon }) => <button key={key} onClick={() => key === 'reminders' ? onReminders() : onPage(key)}><Icon size={20} aria-hidden="true" /><span>{title}</span><ChevronRight size={15} aria-hidden="true" /></button>)}
    </div>
  </div>;

  return <div className="account-view">
    <button className="account-back" onClick={() => onPage('overview')}><ArrowLeft size={17} /> Account</button>
    <div className="section-heading account-section-head"><h1>{selected?.title}</h1>
      {page === 'service' && <button className="primary" onClick={() => onService()}>Add service</button>}
      {page === 'cv' && <button className="primary" disabled={exporting} onClick={onDownload}><ArrowDownToLine size={16} />{exporting ? 'Preparing…' : 'Download PDF'}</button>}
    </div>
    {page === 'statistics' && <>
      <dl className="account-metrics">{metrics.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value.toLocaleString()}</dd></div>)}</dl>
      <p className="subtle account-stat-note">Days at sea are calculated from your logged dates. Overlapping days count once.</p>
      <button className="text-action" onClick={() => onPage('service')}>View sea service <ChevronRight size={16} /></button>
    </>}
    {page === 'service' && <section className="panel">
      {!services.length && <p className="subtle">Add a vessel and sign-on date to start your record.</p>}
      {services.map(item => <button className="item-main reminder-row" key={item.id} onClick={() => onService(item.id)}><span><strong>{item.vessel} · {item.role}</strong><small>{formatDate(item.start)} – {item.end ? formatDate(item.end) : 'Present'}</small></span><ChevronRight size={17} /></button>)}
    </section>}
    {page === 'cv' && <section className="panel">
      <h2>Certificates to include</h2>
      {!data.documents.some(item => types[item.kind] === 'Certificates') && <p className="subtle">Add certificates in Documents to include them here.</p>}
      {data.documents.filter(item => types[item.kind] === 'Certificates').map(item => <label className="cv-choice" key={item.id}><input type="checkbox" checked={data.cvIds.includes(item.id)} onChange={() => onCertificate(item.id)} />{item.title}</label>)}
      <article id="cv-preview" className="cv-preview">
        <h2>{profile.name || 'Maritime CV'}</h2><p>{[profile.rank, profile.email].filter(Boolean).join(' · ')}</p><p>{profile.summary}</p>
        <h3>Sea Service</h3>{services.map(item => <p key={item.id}>{item.vessel} · {item.role} · {formatDate(item.start)} – {item.end ? formatDate(item.end) : 'Present'}</p>)}
        <h3>Certificates</h3>{cv.certificates.map(item => <p key={item.id}>{item.title} · {item.issuer || 'Issuer not recorded'} · {item.verification}{item.expiry && ' · Expires ' + formatDate(item.expiry)}</p>)}
      </article>
    </section>}
  </div>;
}
