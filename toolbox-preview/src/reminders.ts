import { dateOffset, type Data } from './storage';

export function reminders(data: Data) {
  const renewals = data.documents.filter(doc => doc.expiry && doc.expiry <= dateOffset(data.reminderDays))
    .map(doc => ({ id: doc.id, title: 'Renew ' + doc.title, date: doc.expiry, kind: 'document' as const }));
  const tasks = data.voyage.checklist.filter(task => task.due && !task.done)
    .map(task => ({ id: task.id, title: task.title, date: task.due, kind: 'checklist' as const }));
  return [...renewals, ...tasks].sort((a, b) => a.date.localeCompare(b.date));
}
