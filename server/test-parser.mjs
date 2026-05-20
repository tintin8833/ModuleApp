import { parseSheet, pick, canonicalize } from './utils/excelParser.js';

const cases = [
  { path: '/sessions/vibrant-dazzling-bardeen/mnt/uploads/Departments.xlsx',           label: 'Departments' },
  { path: '/sessions/vibrant-dazzling-bardeen/mnt/uploads/Program .xlsx',              label: 'Programs' },
  { path: '/sessions/vibrant-dazzling-bardeen/mnt/uploads/Faculty list.xlsx',          label: 'Faculty' },
  { path: '/sessions/vibrant-dazzling-bardeen/mnt/uploads/course_offerings_dummy.xlsx',label: 'CourseOfferings' },
  { path: '/sessions/vibrant-dazzling-bardeen/mnt/uploads/industry_consultants_dummy.xlsx', label: 'Consultants' },
];

for (const c of cases) {
  const { rows, headers } = parseSheet(c.path);
  console.log(`\n[${c.label}]  headers=${JSON.stringify(headers)}  rows=${rows.length}`);
  console.log('  first row:', JSON.stringify(rows[0]));
}

const sample = { code: 'BSCS', coursetitle: 'CS', instructor: 'Foo' };
console.log('\npick(coursetitle, description):', pick(sample, 'coursetitle', 'description'));
console.log('pick(description, coursetitle):', pick(sample, 'description', 'coursetitle'));
console.log('canonicalize("PROGRAM HEAD"):', canonicalize('PROGRAM HEAD'));
console.log('canonicalize("Course Title"):', canonicalize('Course Title'));
