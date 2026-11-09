import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Keep standalone data copies for previews where the classic reviewer script fails to load.
const script = readFileSync('dist/review-bank.js', 'utf8');
const banks = runInNewContext(script + '\nreviewBanks');
const audit = JSON.parse(readFileSync('review-import-audit.json', 'utf8'));
for (const id of ['nw', 'ew']) {
  const bank = banks.find(item => item.id === id);
  const expected = audit.find(item => item.track === id)?.included;
  if (!expected || bank?.questions.length !== expected) throw Error('Incomplete OIC bank: ' + id);
  writeFileSync('dist/assets/learning/oic-' + id + '.json', JSON.stringify(bank));
}
