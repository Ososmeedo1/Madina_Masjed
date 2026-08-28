import fs from 'fs';

const f = 'components/attendance/EditAttendanceClient.jsx';
let t = fs.readFileSync(f, 'utf8');

const start = t.indexOf('const TIME_FMT');
if (start > -1) {
  const endMarker = '});';
  const end = t.indexOf(endMarker, t.indexOf('const DATE_FMT')) + endMarker.length;
  t = (t.slice(0, start).trimEnd() + '\n\n' + t.slice(end).trimStart());
  fs.writeFileSync(f, t, 'utf8');
  console.log('const block removed. remaining fmt refs:', /TIME_FMT|DATE_FMT/.test(t));
} else {
  console.log('already clean');
}
