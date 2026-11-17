export const types = {
  Passport: 'Passport & IDs', "Seafarer’s Book": 'Passport & IDs', 'Other ID': 'Passport & IDs',
  'Basic Safety Training': 'Certificates', 'Certificate of Competency': 'Certificates',
  'Certificate of Proficiency': 'Certificates', 'Security Awareness': 'Certificates', 'Other Certificate': 'Certificates',
  'Medical Certificate': 'Medicals', 'Sea Service Record': 'Sea Service'
} as const;
export type Kind = keyof typeof types;
export type Category = typeof types[Kind];
export const categories: Category[] = ['Certificates', 'Passport & IDs', 'Medicals', 'Sea Service'];
export type DocumentRecord = { id: string; title: string; kind: Kind; expiry: string; issued: string; issuer: string; file?: File };
export type Requirement = { id: string; kind: Kind; expires: boolean };
export type Checklist = { id: string; title: string; due: string; done: boolean };
export type Voyage = { vessel: string; role: string; joining: string; requirements: Requirement[]; checklist: Checklist[] };
export type Profile = { name: string; rank: string; email: string; summary: string };
export type Service = { id: string; vessel: string; role: string; start: string; end: string };
export type Data = { documents: DocumentRecord[]; voyage: Voyage; profile: Profile; services: Service[]; cvIds: string[]; reminderDays: number };

export function dateOffset(days = 0) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-');
}

export function seed(): Data {
  return {
    documents: [
      { id: 'passport', title: 'Philippine Passport', kind: 'Passport', expiry: dateOffset(720), issued: '', issuer: 'Department of Foreign Affairs' },
      { id: 'safety', title: 'Basic Safety Training', kind: 'Basic Safety Training', expiry: dateOffset(12), issued: '', issuer: 'Sample Maritime Training Center' },
      { id: 'book', title: 'Seafarer’s Record Book', kind: 'Seafarer’s Book', expiry: dateOffset(400), issued: '', issuer: 'Maritime Industry Authority' },
      { id: 'service', title: 'Sea Service Certificate', kind: 'Sea Service Record', expiry: '', issued: dateOffset(-40), issuer: 'Sample Shipping Co.' }
    ],
    voyage: { vessel: 'MV Pacific Horizon', role: 'Third Officer', joining: dateOffset(24),
      requirements: [{ id: 'r1', kind: 'Passport', expires: true }, { id: 'r2', kind: 'Basic Safety Training', expires: true }, { id: 'r3', kind: 'Medical Certificate', expires: true }],
      checklist: [{ id: 'c1', title: 'Confirm flight and joining instructions', due: dateOffset(20), done: false }, { id: 'c2', title: 'Confirm crew agency contact', due: dateOffset(14), done: true }] },
    profile: { name: 'Alex Reyes', rank: 'Third Officer', email: 'alex@example.com', summary: 'Deck officer with experience in cargo operations and bridge watchkeeping.' },
    services: [{ id: 's1', vessel: 'MV Coral Bay', role: 'Third Officer', start: dateOffset(-220), end: dateOffset(-40) }],
    cvIds: ['safety'], reminderDays: 30
  };
}

// IndexedDB commits document metadata and attachments in the same transaction.
export interface ToolboxStorage { load(): Promise<Data>; save(data: Data): Promise<void> }
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('toolbox-preview-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workspace');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const storage: ToolboxStorage = {
  async load() {
    const database = await openDatabase();
    try {
      return await new Promise<Data>((resolve, reject) => {
        const request = database.transaction('workspace').objectStore('workspace').get('data');
        request.onsuccess = () => resolve(request.result ?? seed());
        request.onerror = () => reject(request.error);
      });
    } finally { database.close(); }
  },
  async save(data) {
    const database = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction('workspace', 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
        transaction.objectStore('workspace').put(data, 'data');
      });
    } finally { database.close(); }
  }
};
