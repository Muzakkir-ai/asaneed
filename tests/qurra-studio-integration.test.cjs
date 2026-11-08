const assert=require('node:assert/strict');
const fs=require('node:fs');

const app=fs.readFileSync('legacy/App.tsx','utf8');
const sidebar=fs.readFileSync('legacy/components/WorkspaceNavigation.tsx','utf8');
const directory=fs.readFileSync('legacy/components/NarratorDirectoryPage.tsx','utf8');
const page=fs.readFileSync('app/studio/qurra-diagrams/page.tsx','utf8');
const workspace=fs.readFileSync('app/studio/qurra-diagrams/client.tsx','utf8');

assert.match(sidebar,/\{id:'qurra-diagrams',label:'مخططات أسانيد القراء'[^}]+show:staff/u,
 'Qurra graphs belong in the main staff sidebar');
assert.match(app,/<WorkspaceSidebar active=\{active\}.*dark=\{dark\} onTheme=/u,
 'Studio owns the shared theme and sidebar controls');
assert.match(app,/<TabsContent value="qurra-diagrams"><QurraTransmissionWorkspace onBack=\{\(\)=>setActive\('narrators'\)\}/u,
 'Qurra graphs must use the same studio tabs rather than a standalone shell');
assert.match(app,/localStorage\.getItem\('asaneed-theme'\)/,
 'The normal studio remembers the selected dark theme');
assert.match(directory,/href="\/studio\?page=qurra-diagrams"/,
 'The narrator directory must link into the same studio shell');
assert.match(page,/redirect\('\/studio\?page=qurra-diagrams'\)/,
 'Existing bookmarked Qurra URLs should resolve to the theme-aware studio');
assert.doesNotMatch(page,/QurraTransmissionWorkspace/,
 'The legacy route must not render a second unthemed studio shell');
assert.match(workspace,/export default function QurraTransmissionWorkspace\(\{onBack\}/,
 'The integrated workspace supports internal back navigation');
assert.doesNotMatch(workspace,/<main dir="rtl" className="mx-auto/,
 'Avoid nesting a second main landmark inside the studio main');
console.log('PASS Qurra diagrams reuse Asaneed sidebar, dark mode, language and studio navigation');
