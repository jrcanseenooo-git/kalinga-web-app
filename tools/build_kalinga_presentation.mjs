import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const artifactEntry =
  process.env.ARTIFACT_TOOL_ENTRY ||
  'C:/tmp/codex-presentations/kalinga-cefmu-presentation/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';

const { Presentation, PresentationFile } = await import(pathToFileURL(artifactEntry).href);

const OUT = 'C:/Users/Acer/OneDrive/Documents/github_projects/dswd-kalinga/outputs/Kalinga_CEFMU_System_Presentation_and_MDT_Activity.pptx';
const PREVIEW_DIR = 'C:/tmp/codex-presentations/kalinga-cefmu-presentation/preview';
const MONTAGE = 'C:/tmp/codex-presentations/kalinga-cefmu-presentation/Kalinga_CEFMU_montage.webp';

const W = 1280;
const H = 720;
const brand = '#2d1760';
const brand2 = '#6b4aab';
const accent = '#0ea5e9';
const green = '#059669';
const amber = '#d97706';
const red = '#dc2626';
const ink = '#111827';
const muted = '#6b7280';
const pale = '#f5f3ff';
const line = '#e5e7eb';

const screenshots = {
  dashboard: 'C:/Users/Acer/AppData/Local/Temp/codex-clipboard-07a5dfe6-1bf6-423a-9bec-3a73925f43f5.png',
  caseWorker: 'C:/Users/Acer/AppData/Local/Temp/codex-clipboard-c3655196-1a21-4a63-b006-db57247c7efb.png',
  service: 'C:/Users/Acer/AppData/Local/Temp/codex-clipboard-b3fadb13-7ccf-43e2-9ad1-74e2a4c077db.png',
};

const pres = Presentation.create({ slideSize: { width: W, height: H } });

function addFooter(slide, n) {
  text(slide, 'Project Kalinga CEFMU Registry', 56, 670, 420, 22, 12, muted, true);
  text(slide, String(n).padStart(2, '0'), 1180, 670, 44, 22, 12, muted, true, 'right');
}

function text(slide, value, left, top, width, height, size = 20, color = ink, bold = false, align = 'left') {
  const shape = slide.shapes.add({
    geometry: 'textbox',
    position: { left, top, width, height },
    fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    fontSize: size,
    color,
    bold,
    alignment: align,
    fontFace: 'Aptos',
  };
  return shape;
}

function box(slide, left, top, width, height, fill = 'white', stroke = line, radius = 'rounded-xl') {
  const shape = {
    geometry: radius === 'square' ? 'rect' : 'roundRect',
    position: { left, top, width, height },
    fill,
    line: { style: 'solid', fill: stroke, width: 1 },
  };
  if (radius !== 'square') {
    shape.borderRadius = radius;
  }
  return slide.shapes.add(shape);
}

function rule(slide, left, top, width, color = brand2) {
  slide.shapes.add({
    geometry: 'rect',
    position: { left, top, width, height: 3 },
    fill: color,
    line: { style: 'solid', fill: color, width: 0 },
  });
}

function pill(slide, value, left, top, width, fill, color = 'white') {
  box(slide, left, top, width, 34, fill, fill, 'rounded-full');
  text(slide, value, left + 14, top + 7, width - 28, 18, 13, color, true, 'center');
}

function bulletList(slide, items, left, top, width, gap = 52, size = 20) {
  items.forEach((item, i) => {
    const y = top + i * gap;
    box(slide, left, y + 6, 14, 14, brand2, brand2, 'rounded-full');
    text(slide, item, left + 30, y, width - 30, 42, size, ink, false);
  });
}

function card(slide, title, body, left, top, width, height, color = brand2) {
  box(slide, left, top, width, height, '#ffffff', line, 'rounded-xl');
  box(slide, left + 18, top + 20, 34, 34, color, color, 'rounded-lg');
  text(slide, title, left + 66, top + 18, width - 88, 30, 19, ink, true);
  text(slide, body, left + 24, top + 60, width - 48, Math.max(22, height - 72), 16, muted, false);
}

async function image(slide, file, left, top, width, height, alt, fit = 'cover') {
  const bytes = await fs.readFile(file);
  slide.images.add({
    blob: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    contentType: 'image/png',
    alt,
    fit,
    geometry: 'rect',
    position: { left, top, width, height },
  });
}

function titleSlide() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  pill(slide, 'DSWD KALINGA CEFMU REGISTRY', 56, 58, 290, brand);
  text(slide, 'A child protection case management system for CEFMU response', 56, 178, 920, 160, 56, ink, true);
  rule(slide, 56, 368, 190, brand2);
  text(slide, 'Briefing and participatory MDT dry run for UNICEF, LGU, DSWD, and field case workers', 56, 404, 760, 70, 24, muted);
  text(slide, 'Prepared for system walkthrough and user acceptance discussion', 56, 585, 700, 30, 18, brand2, true);
  addFooter(slide, 1);
}

function slide2() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'The system is built around one practical question', 56, 54, 1020, 54, 39, ink, true);
  text(slide, 'Can every CEFMU case be followed from intake to closure, even when the response involves several offices?', 56, 140, 1040, 96, 34, brand, true);
  bulletList(slide, [
    'Field workers need a simple way to register, update, and monitor cases.',
    'LGU and DSWD implementers need area-based visibility without exposing more data than necessary.',
    'Partners need reliable aggregate information for coordination and reporting.',
  ], 70, 300, 1040, 72, 23);
  addFooter(slide, 2);
}

function slide3() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'The case flow is designed as a complete service journey', 56, 50, 1060, 54, 39, ink, true);
  const steps = [
    ['1', 'Intake', 'Register case and initial assessment'],
    ['2', 'Plan', 'Record concerns, risks, and action plan'],
    ['3', 'Refer', 'Route to MDT member or agency'],
    ['4', 'Serve', 'Log actual service provided'],
    ['5', 'Monitor', 'Track progress, location, and follow-up'],
    ['6', 'Close', 'Document closure readiness and outcome'],
  ];
  steps.forEach((s, i) => {
    const x = 58 + i * 195;
    box(slide, x, 190, 160, 230, i === 0 ? pale : '#ffffff', line, 'rounded-xl');
    text(slide, s[0], x + 20, 210, 40, 40, 30, brand2, true);
    text(slide, s[1], x + 20, 270, 120, 30, 24, ink, true);
    text(slide, s[2], x + 20, 320, 122, 72, 16, muted);
    if (i < steps.length - 1) {
      rule(slide, x + 164, 302, 32, brand2);
    }
  });
  text(slide, 'The future CPS version can reuse this same flow for other child protection case types.', 80, 510, 1040, 48, 24, brand2, true, 'center');
  addFooter(slide, 3);
}

function slide4() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'Each role sees only the modules needed for its work', 56, 50, 1040, 54, 39, ink, true);
  const roles = [
    ['System Administrator', 'Users, audit logs, reports, case monitoring. No intake or registration.'],
    ['Case Worker / Social Worker', 'Intake, case management, MDT referrals, services, progress notes, closure.'],
    ['Field Office / DSWD Implementer', 'Regional referral tracking, monitoring, reports, and support oversight.'],
    ['LGU / Implementer', 'Assigned-area monitoring, service follow-up, and local coordination.'],
    ['CPU Monitor', 'Read-only monitoring for assigned coverage.'],
  ];
  roles.forEach((r, i) => {
    const y = 140 + i * 88;
    box(slide, 74, y, 310, 58, i === 0 ? pale : '#ffffff', line, 'rounded-lg');
    text(slide, r[0], 96, y + 17, 270, 24, 19, i === 0 ? brand : ink, true);
    text(slide, r[1], 430, y + 12, 720, 38, 17, muted);
  });
  addFooter(slide, 4);
}

async function slide5() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'Dashboards become useful when area filters change the story', 56, 42, 1040, 54, 38, ink, true);
  text(slide, 'Region, province, and municipality filters now scope the cards, charts, map, and reports to the selected area.', 56, 100, 910, 48, 21, muted);
  await image(slide, screenshots.dashboard, 64, 168, 720, 410, 'Kalinga dashboard with regional heatmap and charts');
  card(slide, 'For LGU and GIDA work', 'The view can move from national or regional monitoring to a specific province or municipality.', 824, 190, 350, 120, accent);
  card(slide, 'For coordination', 'Teams discuss the same filtered figures instead of comparing separate spreadsheets.', 824, 340, 350, 120, brand2);
  addFooter(slide, 5);
}

function slide6() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'Data privacy is designed into the daily workflow', 56, 50, 1040, 54, 39, ink, true);
  const items = [
    ['Minimum access', 'Roles limit who can register, edit, monitor, export, and administer.'],
    ['Masked lists', 'Client names are hidden by default in case lists and revealed only when needed.'],
    ['Audit trail', 'Logins, edits, exports, and failed access attempts can be reviewed.'],
    ['Aggregate public view', 'Public dashboards show summary figures only, not personally identifiable data.'],
  ];
  items.forEach((item, i) => {
    const x = i % 2 === 0 ? 76 : 650;
    const y = i < 2 ? 170 : 400;
    card(slide, item[0], item[1], x, y, 500, 150, i === 0 ? brand2 : i === 1 ? accent : i === 2 ? amber : green);
  });
  addFooter(slide, 6);
}

function slide7() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'The field design assumes weak or interrupted connectivity', 56, 50, 1060, 54, 39, ink, true);
  const cols = [
    ['Offline capture', 'Case workers can save entries locally when internet is unavailable.'],
    ['Sync on reconnect', 'Queued records sync automatically when connection returns.'],
    ['Area history', 'Location records support LGU coordination and transfer monitoring.'],
    ['Simple controls', 'Role labels, clear modules, and guided forms reduce computer burden.'],
  ];
  cols.forEach((c, i) => card(slide, c[0], c[1], 72 + i * 290, 190, 250, 210, [brand2, accent, green, amber][i]));
  text(slide, 'For GIDA use, the system should be paired with local protocols: device custody, sync schedule, and privacy reminders before field visits.', 90, 505, 1060, 64, 23, brand, true, 'center');
  addFooter(slide, 7);
}

async function slide8() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'The live dry run will use safe QA accounts and sample data', 56, 42, 1040, 54, 38, ink, true);
  await image(slide, screenshots.caseWorker, 660, 138, 540, 360, 'Case worker dashboard screenshot');
  const rows = [
    ['Admin', 'qa.admin@dswd.gov.ph', 'Oversight only'],
    ['Case Worker', 'qa.caseworker@dswd.gov.ph', 'Intake and case work'],
    ['Field Office', 'qa.fouser@kalinga.local', 'Regional monitoring'],
    ['LGU', 'qa.supervisor@kalinga.local', 'Local monitoring'],
    ['CPU Monitor', 'qa.monitor@kalinga.local', 'Read-only monitoring'],
  ];
  rows.forEach((r, i) => {
    const y = 145 + i * 62;
    box(slide, 72, y, 520, 46, i === 1 ? pale : '#ffffff', line, 'rounded-lg');
    text(slide, r[0], 92, y + 12, 130, 22, 17, ink, true);
    text(slide, r[1], 235, y + 12, 220, 22, 15, muted);
    text(slide, r[2], 460, y + 12, 110, 22, 15, brand2, true);
  });
  addFooter(slide, 8);
}

function slide9() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'After the walkthrough, participants become the MDT', 56, 54, 1040, 54, 39, ink, true);
  text(slide, 'The activity is not a computer test. It is a case coordination exercise using the system as the shared record.', 56, 118, 980, 56, 23, muted);
  const phases = [
    ['Read', 'Understand the case packet'],
    ['Decide', 'Agree on risk, referral, and services'],
    ['Record', 'Enter the MDT progress note'],
    ['Review', 'Check dashboard and monitoring view'],
  ];
  phases.forEach((p, i) => {
    const x = 86 + i * 285;
    box(slide, x, 245, 230, 210, '#ffffff', line, 'rounded-xl');
    text(slide, String(i + 1), x + 24, 270, 40, 36, 30, brand2, true);
    text(slide, p[0], x + 24, 335, 180, 32, 27, ink, true);
    text(slide, p[1], x + 24, 385, 176, 48, 17, muted);
  });
  text(slide, 'One laptop per group is enough; the rest can use role cards and printed case sheets.', 110, 540, 1000, 44, 24, brand, true, 'center');
  addFooter(slide, 9);
}

function slide10() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'Fictional case packet for the MDT simulation', 56, 50, 1040, 54, 39, ink, true);
  box(slide, 72, 135, 520, 450, pale, '#ddd6fe', 'rounded-xl');
  text(slide, 'Case: TRAINING-CEFMU-001', 104, 170, 430, 32, 26, brand, true);
  bulletList(slide, [
    'Client: 16-year-old girl, Grade 9 learner, Isabela',
    'Reported early union with adult partner, family pressure, missed classes',
    'Initial concern: safety, psychosocial support, school continuity, legal guidance',
    'Internet in the area is intermittent; case worker synced after field visit',
  ], 110, 235, 410, 62, 18);
  box(slide, 650, 135, 500, 450, '#ffffff', line, 'rounded-xl');
  text(slide, 'MDT challenge', 682, 170, 420, 32, 26, ink, true);
  bulletList(slide, [
    'What is the immediate safety concern?',
    'Who should receive the first referral and why?',
    'What actual service should be recorded today?',
    'What follow-up should be visible to LGU and DSWD implementers?',
  ], 690, 235, 400, 62, 18);
  addFooter(slide, 10);
}

async function slide11() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'The system should capture the MDT decision, not just the meeting', 56, 42, 1120, 54, 38, ink, true);
  box(slide, 74, 132, 500, 380, '#ffffff', line, 'square');
  text(slide, 'Add service', 108, 166, 220, 30, 24, ink, true);
  text(slide, 'Service type', 108, 220, 160, 22, 15, muted, true);
  box(slide, 108, 250, 400, 44, '#ffffff', '#c4b5fd', 'square');
  text(slide, 'Medical', 128, 263, 170, 22, 18, ink);
  text(slide, 'Type of medical service', 108, 315, 240, 22, 15, muted, true);
  box(slide, 108, 345, 400, 44, '#ffffff', '#c4b5fd', 'square');
  text(slide, 'medical checkup', 128, 358, 260, 22, 18, ink);
  text(slide, 'Amount appears only when Financial is selected', 108, 420, 370, 24, 16, green, true);
  box(slide, 108, 456, 250, 44, brand2, brand2, 'square');
  text(slide, 'Add service', 140, 468, 180, 22, 18, 'white', true, 'center');
  const tasks = [
    ['Referral', 'Select the right MDT member and purpose.'],
    ['Progress note', 'Record reason, action taken, and next steps.'],
    ['Service', 'Log actual service provided; amount only for financial aid.'],
    ['Monitoring', 'Check whether role views show the assigned area.'],
  ];
  tasks.forEach((t, i) => card(slide, t[0], t[1], 640, 140 + i * 100, 460, 78, [brand2, accent, green, amber][i]));
  addFooter(slide, 11);
}

function slide12() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  text(slide, 'A good dry run ends with decisions, not applause', 56, 54, 1040, 54, 39, ink, true);
  const questions = [
    'Can a field case worker complete intake and update the case without coaching?',
    'Can LGU and DSWD implementers find only the cases relevant to their area?',
    'Are referral purposes and services clear enough for real MDT use?',
    'What must be added before expanding from CEFMU to broader CPS cases?',
  ];
  bulletList(slide, questions, 110, 170, 960, 78, 24);
  text(slide, 'Capture feedback as actions: must fix, should improve, future CPS feature.', 130, 575, 940, 44, 24, brand2, true, 'center');
  addFooter(slide, 12);
}

function slide13() {
  const slide = pres.slides.add();
  slide.background.fill = '#ffffff';
  pill(slide, 'NEXT STEP', 56, 58, 150, brand);
  text(slide, 'Use the system together, then decide what is ready for field adoption', 56, 176, 900, 150, 52, ink, true);
  rule(slide, 56, 370, 170, brand2);
  text(slide, 'The activity will surface practical improvements from the people who will use the system in real case coordination.', 56, 410, 820, 70, 24, muted);
  text(slide, 'Suggested outputs: UAT notes, role/module sign-off, security/privacy concerns, and future CPS feature list.', 56, 555, 920, 40, 20, brand2, true);
  addFooter(slide, 13);
}

const slideBuilders = [
  titleSlide,
  slide2,
  slide3,
  slide4,
  slide5,
  slide6,
  slide7,
  slide8,
  slide9,
  slide10,
  slide11,
  slide12,
  slide13,
];

const limitSlides = Number.parseInt(process.env.LIMIT_SLIDES || String(slideBuilders.length), 10);
for (const build of slideBuilders.slice(0, limitSlides)) {
  await build();
}

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.mkdir(PREVIEW_DIR, { recursive: true });

for (const [index, slide] of pres.slides.items.entries()) {
  const png = await pres.export({ slide, format: 'png', scale: 1 });
  await fs.writeFile(path.join(PREVIEW_DIR, `slide-${String(index + 1).padStart(2, '0')}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: 'layout' });
  await fs.writeFile(path.join(PREVIEW_DIR, `slide-${String(index + 1).padStart(2, '0')}.layout.json`), await layout.text());
}

const montage = await pres.export({ format: 'webp', montage: true, scale: 1 });
await fs.writeFile(MONTAGE, new Uint8Array(await montage.arrayBuffer()));

const pptx = await PresentationFile.exportPptx(pres);
await pptx.save(OUT);

console.log(OUT);
console.log(MONTAGE);
