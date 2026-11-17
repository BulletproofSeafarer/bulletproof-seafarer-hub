import { Anchor, ArrowLeft, ArrowUpRight, BriefcaseBusiness, ChevronRight, FileBadge2, GraduationCap, HeartPulse, MapPin, UsersRound } from 'lucide-react';
import { mapLinks, serviceGroups, type ServiceGroup } from './services';

const categoryDetails = {
  maritime: { icon: Anchor, summary: 'MARINA, SID and SRB' },
  medical: { icon: HeartPulse, summary: 'Pre-employment exams' },
  ofw: { icon: UsersRound, summary: 'Benefits and contributions' },
  training: { icon: GraduationCap, summary: 'Courses and enrollment' },
  manning: { icon: BriefcaseBusiness, summary: 'Crewing agencies' },
  documents: { icon: FileBadge2, summary: 'Passport, NBI and PSA' }
};

const details = (group: ServiceGroup) => categoryDetails[group.id];

export type ExternalDestination = { name: string; url: string; purpose: string };

export function ServiceCategories({ onSelect }: { onSelect: (group: ServiceGroup) => void }) {
  return <section className="home-services" aria-labelledby="services-heading">
    <div className="section-heading"><h2 id="services-heading">Seafarer Services</h2><span className="service-region"><MapPin size={14} /> Philippines</span></div>
    <div className="service-categories">
      {serviceGroups.map(group => {
        const { icon: Icon, summary } = details(group);
        return <button id={`service-category-${group.id}`} key={group.id} onClick={() => onSelect(group)}>
          <span className="service-icon"><Icon size={19} aria-hidden="true" /></span>
          <span><strong>{group.label}</strong><small>{summary}</small></span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>;
      })}
    </div>
  </section>;
}

export function ServiceDirectory({ group, onBack, onExternal }: {
  group: ServiceGroup;
  onBack: () => void;
  onExternal: (destination: ExternalDestination) => void;
}) {
  const { summary } = details(group);
  return <section className="service-directory" aria-labelledby="service-directory-heading">
    <button className="account-back" onClick={onBack}><ArrowLeft size={17} /> Seafarer Services</button>
    <div className="page-heading"><div><h1 id="service-directory-heading" tabIndex={-1}>{group.label}</h1><p>{summary}</p></div></div>
    <ul className="service-list">
      {group.services.map(service => <li key={service.name} className="service-row">
        <div><strong>{service.name}</strong><p>{service.purpose}</p></div>
        <div className="service-links">
          <button aria-label={`Open ${service.name} website`} onClick={() => onExternal(service)}>Website <ArrowUpRight size={16} /></button>
          {service.mapQuery && <MapMenu name={service.name} query={service.mapQuery} onExternal={onExternal} />}
        </div>
      </li>)}
    </ul>
  </section>;
}

function MapMenu({ name, query, onExternal }: { name: string; query: string; onExternal: (destination: ExternalDestination) => void }) {
  const maps = mapLinks(query);
  const purpose = `Look up ${name} locations and confirm the branch before travelling.`;
  return <details>
    <summary aria-label={`Find ${name} on a map`}><MapPin size={16} /> Find on map</summary>
    <div className="map-options">
      <button onClick={() => onExternal({ name: 'Apple Maps', url: maps.apple, purpose })}>Apple Maps <ArrowUpRight size={15} /></button>
      <button onClick={() => onExternal({ name: 'Google Maps', url: maps.google, purpose })}>Google Maps <ArrowUpRight size={15} /></button>
    </div>
  </details>;
}
