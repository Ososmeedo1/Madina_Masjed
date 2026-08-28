import fs from 'fs';
import path from 'path';

const roots = ['app', 'components', 'lib'];
const exts = new Set(['.js', '.jsx']);
const patterns = [
  /toLocaleDateString/,
  /toLocaleTimeString/,
  /hour12:\s*false/,
  /'en-GB'/,
  /"en-GB"/,
  /type=["']date["']/,
  /\bAM\b/,
  /\bPM\b/,
  /January|February|March|April|June|July|August|September|October|November|December/,
];

const hits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (exts.has(path.extname(entry.name))) {
      const t = fs.readFileSync(full, 'utf8');
      for (const p of patterns) {
        if (p.test(t)) hits.push(`${full} :: ${p}`);
      }
    }
  }
}
roots.forEach(walk);

if (hits.length === 0) console.log('AUDIT CLEAN — no gregorian/24h/locale leaks');
else {
  console.log('LEAKS:');
  hits.forEach((h) => console.log(' ', h));
}
