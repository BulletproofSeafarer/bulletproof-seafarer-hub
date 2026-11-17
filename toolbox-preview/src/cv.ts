import { types, type Data } from './storage';

export function assembleCV(data: Data) {
  return {
    profile: data.profile,
    services: [...data.services].sort((a, b) => b.start.localeCompare(a.start)),
    certificates: data.documents.filter(doc => types[doc.kind] === 'Certificates' && data.cvIds.includes(doc.id))
      .map(({ id, title, issuer, expiry }) => ({ id, title, issuer, expiry, verification: 'Self-reported' }))
  };
}
