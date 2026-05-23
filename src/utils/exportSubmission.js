/**
 * Export a syllabus / TOS submission to PDF.
 *
 * Mirrors the approach already used in CoursesTable.jsx: build a styled,
 * print-ready HTML document, open it in a new window, and trigger the
 * browser's print dialog (where the user can "Save as PDF"). No extra
 * PDF library required.
 */

function esc(value) {
  return String(value ?? '').replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function asObject(content) {
  if (!content) return {};
  if (typeof content === 'string') {
    try { return JSON.parse(content); } catch (_e) { return {}; }
  }
  return content;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

const BASE_CSS = `
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; margin: 40px; }
  .doc-head { border-bottom: 3px solid #b91c1c; padding-bottom: 12px; margin-bottom: 20px; }
  .doc-kicker { color: #b91c1c; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .doc-title { font-size: 22px; font-weight: 800; margin: 4px 0; }
  .doc-meta { font-size: 13px; color: #475569; }
  .doc-meta b { color: #1e293b; }
  h2 { font-size: 15px; color: #b91c1c; margin: 22px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  p { font-size: 13px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 6px; }
  th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; vertical-align: top; }
  th { background: #f8fafc; color: #475569; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.3px; }
  ul { margin: 6px 0; padding-left: 20px; font-size: 13px; line-height: 1.5; }
  @media print { body { margin: 16mm; } }
`;

function frame(title, bodyHtml) {
  return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) +
    '</title><style>' + BASE_CSS + '</style></head><body>' + bodyHtml + '</body></html>';
}

function metaBlock(kicker, sub) {
  const c = asObject(sub.content);
  return (
    '<div class="doc-head">' +
      '<div class="doc-kicker">' + esc(kicker) + '</div>' +
      '<div class="doc-title">' + esc(sub.course_code || c.code || '') + ' — ' + esc(sub.course_name || c.name || '') + '</div>' +
      '<div class="doc-meta">' +
        '<b>Department:</b> ' + esc(sub.department_name || (sub.department && sub.department.name) || c.department || '—') + ' &nbsp;·&nbsp; ' +
        '<b>Instructor:</b> ' + esc(sub.instructor_name || c.instructor || '—') + ' &nbsp;·&nbsp; ' +
        '<b>Submitted:</b> ' + esc(formatDate(sub.submitted_at)) + ' &nbsp;·&nbsp; ' +
        '<b>Status:</b> ' + esc(sub.status || 'Submitted') +
      '</div>' +
    '</div>'
  );
}

function buildSyllabusHtml(sub) {
  const c = asObject(sub.content);
  let body = metaBlock('Learning Plan Submission', sub);

  if (c.credits || c.units || c.prerequisites) {
    body += '<h2>Course Details</h2><table><tbody>' +
      (c.credits ? '<tr><th>Credits</th><td>' + esc(c.credits) + '</td></tr>' : '') +
      (c.units ? '<tr><th>Units</th><td>' + esc(c.units) + '</td></tr>' : '') +
      (c.prerequisites ? '<tr><th>Prerequisites</th><td>' + esc(c.prerequisites) + '</td></tr>' : '') +
      '</tbody></table>';
  }
  if (c.description) {
    body += '<h2>Course Description</h2><p>' + esc(c.description) + '</p>';
  }
  if (Array.isArray(c.outcomes) && c.outcomes.length) {
    body += '<h2>Course Outcomes</h2><ul>' +
      c.outcomes.map((o) => '<li><b>' + esc(o.id || '') + '</b> ' + esc(o.text || o) + '</li>').join('') +
      '</ul>';
  }
  if (Array.isArray(c.references) && c.references.length) {
    body += '<h2>References</h2><ul>' +
      c.references.map((r) => '<li>' + esc(r.title || r) + (r.author ? ' — ' + esc(r.author) : '') + (r.year ? ' (' + esc(r.year) + ')' : '') + '</li>').join('') +
      '</ul>';
  }
  if (Array.isArray(c.grading) && c.grading.length) {
    body += '<h2>Criteria for Grading</h2><table><thead><tr><th>Component</th><th>Weight</th></tr></thead><tbody>' +
      c.grading.map((g) => '<tr><td>' + esc(g.component) + '</td><td>' + esc(g.weight) + '</td></tr>').join('') +
      '</tbody></table>';
  }
  return frame('Learning Plan — ' + (sub.course_code || ''), body);
}

function buildTosHtml(sub) {
  const c = asObject(sub.content);
  let body = metaBlock('Table of Specifications', sub);

  body += '<h2>Examination</h2><p><b>' + esc(c.exam || 'Examination') + '</b>' +
    (c.totalItems ? ' &nbsp;·&nbsp; Total Items: ' + esc(c.totalItems) : '') +
    (c.totalPoints ? ' &nbsp;·&nbsp; Total Points: ' + esc(c.totalPoints) : '') + '</p>';

  if (Array.isArray(c.specifications) && c.specifications.length) {
    body += '<h2>Specifications</h2><table><thead><tr>' +
      '<th>Topic</th><th>Hours</th><th>%</th><th>No. of Items</th><th>Cognitive Level</th>' +
      '</tr></thead><tbody>' +
      c.specifications.map((r) => '<tr>' +
        '<td>' + esc(r.topic) + '</td>' +
        '<td>' + esc(r.hours) + '</td>' +
        '<td>' + esc(r.percentage) + '</td>' +
        '<td>' + esc(r.items) + '</td>' +
        '<td>' + esc(r.cognitiveLevel) + '</td>' +
      '</tr>').join('') +
      '</tbody></table>';
  }
  return frame('TOS — ' + (sub.course_code || ''), body);
}

export function exportSubmissionToPdf(submission, kind) {
  const html = kind === 'tos' ? buildTosHtml(submission) : buildSyllabusHtml(submission);
  const w = window.open('', '', 'width=900,height=1000');
  if (!w) {
    window.alert('Please allow pop-ups for this site to export the PDF.');
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (_e) { /* user can print manually */ } }, 400);
}
