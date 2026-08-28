import fs from 'fs';

function apply(file, pairs) {
  let t = fs.readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    if (!t.includes(from)) {
      console.log(`MISS in ${file}: ${from.slice(0, 60)}`);
      continue;
    }
    t = t.split(from).join(to);
  }
  fs.writeFileSync(file, t, 'utf8');
}

apply('components/dashboard/DashboardClient.jsx', [
  [
    '<p dir="ltr" className="font-jakarta text-sm font-semibold">{g.startTime} - {g.endTime}</p>',
    '<p className="font-jakarta text-sm font-semibold text-on-surface-variant">{g.startTimeLabel} - {g.endTimeLabel}</p>',
  ],
]);

apply('components/attendance/AttendanceClient.jsx', [
  [
    '<span dir="ltr" className="font-jakarta text-sm text-on-surface-variant">\n          {data.group.startTime} - {data.group.endTime}\n        </span>',
    '<span className="font-jakarta text-sm text-on-surface-variant">\n          {data.group.startTimeLabel || data.group.startTime} — {data.group.endTimeLabel || data.group.endTime}\n        </span>',
  ],
]);

apply('app/history/page.js', [
  [
    '                    <div className="flex items-center justify-between gap-2">\n                      <h2 className="text-lg">{g.name}</h2>\n                      <span dir="ltr" className="font-jakarta text-sm text-on-surface-variant">\n                        {g.startTime} - {g.endTime}\n                      </span>\n                    </div>',
    '                    <div className="flex items-center justify-between gap-2">\n                      <h2 className="text-lg">{g.name}</h2>\n                      <span className="font-jakarta text-sm text-on-surface-variant">\n                        {g.startTimeLabel} — {g.endTimeLabel}\n                      </span>\n                    </div>',
  ],
]);

apply('components/history/DatesChips.jsx', [
  ['{d.date} ({d.students})', '{d.hijriLabel} ({d.students})'],
]);

apply('app/history/[date]/[groupId]/page.js', [
  [
    '<p dir="ltr" className="font-jakarta text-sm text-on-surface-variant">\n            {detail.date.value} · {detail.group.startTime} - {detail.group.endTime}\n          </p>',
    '<p className="font-jakarta text-sm text-on-surface-variant">\n            {detail.date.hijriShort} · {detail.group.startTimeLabel} — {detail.group.endTimeLabel}\n          </p>',
  ],
]);

apply('components/holidays/HolidayManager.jsx', [
  ['<p dir="ltr" className="font-jakarta font-bold">{h.startDate}</p>', '<p className="font-bold">{h.dateHijri}</p>'],
]);
