import { ArrowRight, CalendarDays, CircleAlert, Clock3, FileCheck2, Ship } from 'lucide-react';
import { status } from './readiness';
import { dateOffset, type DocumentRecord, type Voyage } from './storage';

const metrics = [
  { status: 'Valid', label: 'Valid', tone: 'ready' },
  { status: 'Expiring Soon', label: 'Expiring', tone: 'due' },
  { status: 'Expired', label: 'Expired', tone: 'late' }
] as const;

const day = (date: string) => Date.parse(date + 'T00:00:00Z');
const remaining = (date: string) => Math.round((day(date) - day(dateOffset())) / 86_400_000);
const dateLabel = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(day(date));

function countdown(date: string, purpose: 'join' | 'expiry') {
  if (!date) return purpose === 'join' ? 'Set a joining date' : 'No expiry date';
  const days = remaining(date);
  if (days === 0) return purpose === 'join' ? 'Joining today' : 'Expires today';
  const span = `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'}`;
  if (days < 0) return purpose === 'join' ? `Joining date passed ${span} ago` : `Expired ${span} ago`;
  return purpose === 'join' ? `${span} to join` : `${span} left`;
}

type Props = {
  firstName: string;
  rank: string;
  voyage: Voyage;
  documents: DocumentRecord[];
  reminderDays: number;
  met: number;
  onVoyage: () => void;
  onDocuments: (filter: string) => void;
  onDocument: (document: DocumentRecord) => void;
};

export function Dashboard({ firstName, rank, voyage, documents, reminderDays, met, onVoyage, onDocuments, onDocument }: Props) {
  const total = voyage.requirements.length;
  const outstanding = total - met;
  const dated = documents.filter(document => document.expiry).sort((a, b) => a.expiry.localeCompare(b.expiry));
  const next = dated.find(document => document.expiry >= dateOffset()) ?? dated.at(-1);
  return <>
    <div className="page-heading home-heading">
      <div><h1>Hi, {firstName || 'Seafarer'}</h1>{rank && <p>{rank}</p>}</div>
      <span className="home-date"><CalendarDays size={16} />{dateLabel(dateOffset())}</span>
    </div>
    <section className="home-hero" aria-labelledby="home-vessel">
      <div className="home-hero-content">
        <span className="home-voyage-label"><Ship size={16} /> Next voyage</span>
        <h2 id="home-vessel">{voyage.vessel || 'Your next vessel'}</h2>
        <p>{[voyage.role, voyage.joining && 'Joins ' + dateLabel(voyage.joining)].filter(Boolean).join(' · ')}</p>
        <button className="home-voyage-link" onClick={onVoyage}>Voyage Ready <ArrowRight size={17} /></button>
      </div>
    </section>
    <div className="home-voyage-stats">
      <button onClick={onVoyage}><Clock3 size={19} /><strong>{countdown(voyage.joining, 'join')}</strong><span>Sign-on countdown</span></button>
      <button onClick={onVoyage}><FileCheck2 size={19} /><strong>{met} / {total}</strong><span>Required documents ready</span></button>
    </div>
    <section className="home-documents">
      <div className="section-heading"><h2>Document status</h2><button className="text-action" onClick={() => onDocuments('')}>Open documents <ArrowRight size={15} /></button></div>
      <div className="home-metrics">
        {metrics.map(metric => <button key={metric.status} className={metric.tone} onClick={() => onDocuments(metric.status)}>
          <strong>{documents.filter(document => status(document, reminderDays) === metric.status).length}</strong><span>{metric.label}</span>
        </button>)}
      </div>
      {next && <button className="home-renewal" onClick={() => onDocument(next)}>
        <span className="home-renewal-icon"><CircleAlert size={20} /></span>
        <span><strong>{next.title}</strong><small>{next.expiry < dateOffset() ? 'Expired ' : 'Expires '}{dateLabel(next.expiry)}</small></span>
        <span className="renewal-time">{countdown(next.expiry, 'expiry')} <ArrowRight size={15} /></span>
      </button>}
    </section>
    {outstanding > 0 && <button className="home-voyage-alert" onClick={onVoyage}><CircleAlert size={18} />{outstanding} voyage {outstanding === 1 ? 'requirement needs' : 'requirements need'} attention <ArrowRight size={15} /></button>}
  </>;
}
