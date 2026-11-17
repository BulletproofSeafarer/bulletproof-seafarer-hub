import type { MouseEvent } from 'react';
import { ArrowLeftRight, CalendarDays, ChevronRight, CircleDollarSign, ClipboardList, Luggage, ReceiptText, Waves, Wrench } from 'lucide-react';
import { WorldTime } from './WorldTime';
import type { ExternalDestination } from './Services';

export type UtilityItem = { id: string; title: string; description: string };

const utilityIcons = {
  currency: ArrowLeftRight,
  contrib: ClipboardList,
  invoice: ReceiptText,
  contract: CalendarDays,
  allot: CircleDollarSign,
  weather: Waves,
  travel: Luggage
};

const weatherDestinations: Record<string, ExternalDestination> = {
  'https://www.windy.com/': { name: 'Windy', url: 'https://www.windy.com/', purpose: 'View interactive wind and weather forecasts.' },
  'https://www.windy.com/-Waves-waves': { name: 'Windy Waves', url: 'https://www.windy.com/-Waves-waves', purpose: 'View the wave forecast map.' },
  'https://www.tideschart.com/': { name: 'Tideschart', url: 'https://www.tideschart.com/', purpose: 'Look up tide tables for a port or coastal location.' }
};

export function Tools({ utilities, utilityPage, onUtility, onExternal }: {
  utilities: UtilityItem[];
  utilityPage?: string;
  onUtility: (id: string) => void;
  onExternal: (destination: ExternalDestination) => void;
}) {
  function confirmExternal(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    const destination = link && weatherDestinations[link.href];
    if (!destination) return;
    event.preventDefault();
    onExternal(destination);
  }

  if (utilityPage !== undefined) return <div className="panel legacy" onClick={confirmExternal} dangerouslySetInnerHTML={{ __html: utilityPage }} />;

  return <>
    <div className="page-heading"><h1>Tools</h1></div>
    <WorldTime />
    <section className="tools-utilities" aria-labelledby="tools-utilities-heading">
      <div className="section-heading"><h2 id="tools-utilities-heading">Utilities</h2></div>
      {utilities.length ? <div className="tool-grid">
        {utilities.map(({ id, title, description }) => {
          const Icon = utilityIcons[id as keyof typeof utilityIcons] ?? Wrench;
          return <button key={id} onClick={() => onUtility(id)}>
            <span className="service-icon"><Icon size={19} aria-hidden="true" /></span>
            <span><strong>{title}</strong><small>{description}</small></span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>;
        })}
      </div> : <p className="subtle" role="status">Tools are unavailable. Reload Toolbox to try again.</p>}
    </section>
  </>;
}
