import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';

const cities = [
  ['Manila, Philippines', 'Asia/Manila'], ['Oslo, Norway', 'Europe/Oslo'], ['London, United Kingdom', 'Europe/London'],
  ['Singapore', 'Asia/Singapore'], ['Tokyo, Japan', 'Asia/Tokyo'], ['Dubai, UAE', 'Asia/Dubai'],
  ['New York, USA', 'America/New_York'], ['Los Angeles, USA', 'America/Los_Angeles'],
  ['Rotterdam, Netherlands', 'Europe/Amsterdam'], ['Mumbai, India', 'Asia/Kolkata'],
  ['Sydney, Australia', 'Australia/Sydney'], ['UTC / GMT', 'UTC']
] as const;
const shipZones = Array.from({ length: 27 }, (_, index) => index - 12).filter(offset => offset !== 0)
  .map(offset => [`UTC${offset > 0 ? '+' : '−'}${Math.abs(offset)}`, `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`] as const);
const validZones = new Set([...cities, ...shipZones].map(([, zone]) => zone));
const defaults = { left: 'Asia/Manila', right: 'Europe/Oslo' };
const key = 'toolbox2-world-clocks-v1';
type Zones = typeof defaults;

function readZones(): Zones {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') ?? {};
    return {
      left: validZones.has(saved.left) ? saved.left : defaults.left,
      right: validZones.has(saved.right) ? saved.right : defaults.right
    };
  } catch { return defaults; }
}

function offsetInMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date);
  const offset = parts.find(part => part.type === 'timeZoneName')?.value ?? 'GMT';
  const fields = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  return fields ? (fields[1] === '-' ? -1 : 1) * (Number(fields[2]) * 60 + Number(fields[3] || 0)) : 0;
}

export function WorldTime() {
  const [zones, setZones] = useState(readZones);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 1_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  function setZone(side: keyof Zones, zone: string) {
    const next = { ...zones, [side]: zone };
    setZones(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep the selection for this visit. */ }
  }

  const difference = offsetInMinutes(now, zones.right) - offsetInMinutes(now, zones.left);
  const magnitude = Math.abs(difference);
  const duration = [Math.floor(magnitude / 60) && `${Math.floor(magnitude / 60)}h`, magnitude % 60 && `${magnitude % 60}m`].filter(Boolean).join(' ');
  return <section className="world-time-card" aria-labelledby="world-time-heading">
    <div className="world-time-heading"><span className="service-icon"><Clock3 size={19} /></span><h2 id="world-time-heading">World Time</h2></div>
    <div className="world-clocks">
      {(['left', 'right'] as const).map(side => {
        const zone = zones[side];
        const label = side === 'left' ? 'Home' : 'Vessel / local';
        const time = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
        const date = new Intl.DateTimeFormat('en-GB', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' }).format(now);
        return <div className="world-clock" key={side}>
          <label htmlFor={`world-${side}`}>{label}</label>
          <select id={`world-${side}`} aria-label={`${label} time zone`} value={zone} onChange={event => setZone(side, event.target.value)}>
            <optgroup label="Ports and cities">{cities.map(([name, value]) => <option key={value} value={value}>{name.split(',')[0]}</option>)}</optgroup>
            <optgroup label="Fixed ship time">{shipZones.map(([name, value]) => <option key={value} value={value}>{name}</option>)}</optgroup>
          </select>
          <strong>{time}</strong><span>{date}</span>
        </div>;
      })}
    </div>
    <p className="world-time-difference">{difference === 0 ? 'Home and vessel are on the same time' : `Vessel is ${duration} ${difference > 0 ? 'ahead of' : 'behind'} home`}</p>
  </section>;
}
