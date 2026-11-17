import { types, type Data } from './storage';

export function assembleCV(data: Data) {
  return {
    profile: data.profile,
    services: [...data.services].sort((a, b) => b.start.localeCompare(a.start)),
    certificates: data.documents.filter(doc => types[doc.kind] === 'Certificates' && data.cvIds.includes(doc.id))
      .map(({ id, title, issuer, expiry }) => ({ id, title, issuer, expiry, verification: 'Self-reported' }))
  };
}

export type MaritimeCV = ReturnType<typeof assembleCV>;

export function formatDate(date: string) {
  return date ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(date + 'T12:00:00Z')) : '—';
}
