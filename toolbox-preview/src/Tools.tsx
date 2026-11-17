import type { MouseEvent } from 'react';
import { WorldTime } from './WorldTime';
import type { ExternalDestination } from './Services';

const weatherDestinations: Record<string, ExternalDestination> = {
  'https://www.windy.com/': { name: 'Windy', url: 'https://www.windy.com/', purpose: 'View interactive wind and weather forecasts.' },
  'https://www.windy.com/-Waves-waves': { name: 'Windy Waves', url: 'https://www.windy.com/-Waves-waves', purpose: 'View the wave forecast map.' },
  'https://www.tideschart.com/': { name: 'Tideschart', url: 'https://www.tideschart.com/', purpose: 'Look up tide tables for a port or coastal location.' }
};

export function Tools({ utilityDirectory, utilityPage, onExternal }: {
  utilityDirectory: string;
  utilityPage?: string;
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
      <div className="legacy-directory" dangerouslySetInnerHTML={{ __html: utilityDirectory }} />
    </section>
  </>;
}
