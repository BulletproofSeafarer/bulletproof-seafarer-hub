import { dateOffset, type DocumentRecord, type Requirement, type Voyage } from './storage';
export type Status = 'Valid' | 'Expiring Soon' | 'Expired' | 'No Expiry Recorded';
export function status(document: DocumentRecord, days: number): Status {
  if (!document.expiry) return 'No Expiry Recorded';
  if (document.expiry < dateOffset()) return 'Expired';
  return document.expiry <= dateOffset(days) ? 'Expiring Soon' : 'Valid';
}

function assess(document: DocumentRecord, requirement: Requirement, joining: string): keyof typeof priority {
  if (!document.expiry) return requirement.expires ? 'Needs Review' : 'Met';
  if (document.expiry < dateOffset()) return 'Expired';
  if (!joining) return 'Needs Review';
  return document.expiry < joining ? 'Expiring Before Join' : 'Met';
}

const priority = { Met: 0, 'Expiring Before Join': 1, Expired: 2, 'Needs Review': 3 };

export function readiness(voyage: Voyage, documents: DocumentRecord[]) {
  return voyage.requirements.map(requirement => {
    const match = documents.filter(document => document.kind === requirement.kind)
      .map(document => ({ document, result: assess(document, requirement, voyage.joining) }))
      .sort((a, b) => priority[a.result] - priority[b.result] || b.document.expiry.localeCompare(a.document.expiry))[0];
    return { requirement, document: match?.document, result: match?.result ?? 'Missing' };
  });
}
