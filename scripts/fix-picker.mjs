import fs from 'fs';

const f = 'components/ui/HijriDatePicker.jsx';
let t = fs.readFileSync(f, 'utf8');

t = t.replace('  const touchedRef = useRef(false);\n', '');
t = t.replace('    touchedRef.current = true;\n', '');

fs.writeFileSync(f, t, 'utf8');
console.log('cleaned. useRef present:', t.includes('useRef'), '| touched:', t.includes('touched'));
