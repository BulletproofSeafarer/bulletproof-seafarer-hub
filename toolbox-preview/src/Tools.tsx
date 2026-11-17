import { useRef, useState } from 'react';
import { Anchor, ArrowRight, ArrowUpRight, BriefcaseBusiness, Compass, FileBadge2, GraduationCap, HeartPulse, MapPin, Search, UsersRound, Wrench } from 'lucide-react';
import { mapLinks, serviceGroups } from './services';

const icons = [Anchor, HeartPulse, UsersRound, GraduationCap, BriefcaseBusiness, FileBadge2];
const guides = [
  { category: 'maritime', title: 'Get your seafarer ID', description: 'Certification, SID and record book', icon: Anchor },
  { category: 'medical', title: 'Book a medical exam', description: 'Find a PEME clinic', icon: HeartPulse },
  { category: 'documents', title: 'Prepare your paperwork', description: 'Passport, NBI and civil records', icon: FileBadge2 }
];

export function Tools({ utilityDirectory }: { utilityDirectory: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const directory = useRef<HTMLElement>(null);
  const term = query.toLowerCase().trim();
  const groups = serviceGroups.flatMap((group, index) => {
    if (category && category !== group.id) return [];
    const services = group.services.filter(service =>
      term.split(/\s+/).every(word => `${group.label} ${service.name} ${service.purpose} ${service.mapQuery ?? ''}`.toLowerCase().includes(word))
    );
    return services.length ? [{ ...group, icon: icons[index], services }] : [];
  });

  function chooseCategory(id: string) {
    setCategory(id);
    setQuery('');
    directory.current?.focus({ preventScroll: true });
    directory.current?.scrollIntoView({ block: 'start' });
  }

  return <>
    <div className="page-heading"><div><h1>Tools</h1><p>Find the right port of call for everyday crew needs.</p></div><a className="secondary" href="#utilities"><Wrench size={16} /> Utilities</a></div>
    <div className="services-banner">
      <div><span className="services-kicker"><MapPin size={15} /> PHILIPPINES</span><h2>Seafarer Services</h2><p>Find where to book appointments, get documents, train, and connect with crew agencies.</p></div>
      <Compass className="services-compass" size={148} strokeWidth={0.8} aria-hidden="true" />
    </div>
    <div className="service-guides" aria-label="Common tasks">
      {guides.map(({ title, description, category, icon: Icon }) => <button key={category} onClick={() => chooseCategory(category)}>
        <span className="service-guide-icon"><Icon size={19} /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={17} />
      </button>)}
    </div>
    <section className="service-directory" ref={directory} tabIndex={-1} aria-labelledby="directory-heading">
      <div className="section-heading"><h2 id="directory-heading">Service directory</h2></div>
      <label className="search"><Search size={18} /><input aria-label="Search seafarer services" placeholder="Search providers, appointments, or services…" value={query} onChange={event => { setQuery(event.target.value); setCategory(''); }} /></label>
      <div className="chips" aria-label="Filter service categories">
        <button aria-pressed={!category} onClick={() => setCategory('')}>All services</button>
        {serviceGroups.map(group => <button key={group.id} aria-pressed={category === group.id} onClick={() => setCategory(group.id)}>{group.label}</button>)}
      </div>
      <p className="service-count" aria-live="polite">{groups.reduce((count, group) => count + group.services.length, 0)} services</p>
      {groups.length === 0 && <div className="panel"><p>No matching services.</p><button className="secondary mt-3" onClick={() => { setQuery(''); setCategory(''); }}>Clear filters</button></div>}
      <div className="service-groups">
        {groups.map(({ id, label, icon: Icon, services }) => <section key={id} className="service-group">
          <h3><Icon size={18} />{label}</h3>
          {services.map(service => <div className="service-row" key={service.name}>
            <div><strong>{service.name}</strong><small>{service.purpose}</small></div>
            <div className="service-links">
              <a href={service.url} target="_blank" rel="noreferrer" aria-label={`Open ${service.name} website`}>Website <ArrowUpRight size={15} /></a>
              {service.mapQuery && <MapMenu name={service.name} query={service.mapQuery} />}
            </div>
          </div>)}
        </section>)}
      </div>
    </section>
    <section id="utilities" className="utilities-section">
      <div className="section-heading"><h2>Utilities</h2></div>
      <div className="legacy-directory" dangerouslySetInnerHTML={{ __html: utilityDirectory }} />
    </section>
  </>;
}

function MapMenu({ name, query }: { name: string; query: string }) {
  const maps = mapLinks(query);
  return <details>
    <summary aria-label={`Find ${name} on a map`}><MapPin size={15} /> Find on map</summary>
    <div className="map-options">
      <small>Check the branch before travelling.</small>
      <a href={maps.apple} target="_blank" rel="noreferrer">Apple Maps <ArrowUpRight size={14} /></a>
      <a href={maps.google} target="_blank" rel="noreferrer">Google Maps <ArrowUpRight size={14} /></a>
    </div>
  </details>;
}
