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
assert.match(app,/<TabsContent value="qurra-diagrams"><QurraTransmissionWorkspace\/>/u,
 'Qurra graphs must use the same studio tabs rather than a standalone shell');
assert.match(app,/localStorage\.getItem\('asaneed-theme'\)/,
 'The normal studio remembers the selected dark theme');
assert.doesNotMatch(directory,/href="\/studio\?page=qurra-diagrams"/,
 'Qurra diagrams must not be kept inside رجال الأسانيد');
assert.match(page,/redirect\('\/studio\?page=qurra-diagrams'\)/,
 'Existing bookmarked Qurra URLs should resolve to the theme-aware studio');
assert.doesNotMatch(page,/QurraTransmissionWorkspace/,
 'The legacy route must not render a second unthemed studio shell');
assert.match(sidebar,/show:staff,group:'أسانيد القراء'/u,
 'The Qurra workspace has its own navigation group');
assert.doesNotMatch(workspace,/العودة إلى رجال الأسانيد/u,
 'The independent workspace must not navigate back into narrator directory');
assert.match(workspace,/initialRouteId=\{selectedRoute.routeId\}/u,
 'Manual continuation starts in the exact selected saved route');
assert.match(workspace,/selectedContinuation\?\.missing.length/u,
 'Completion guidance distinguishes approved shared continuations from partial paths');
assert.doesNotMatch(workspace,/<main dir="rtl" className="mx-auto/,
 'Avoid nesting a second main landmark inside the studio main');
console.log('PASS Qurra diagrams reuse Asaneed sidebar, dark mode, language and studio navigation');

const routeEditor=fs.readFileSync('legacy/components/BookTariqBuilder.tsx','utf8');
assert.match(routeEditor,/initialRouteId\?:string/u,
 'The existing reviewed route editor supports directly opening an existing saved route');
assert.match(routeEditor,/focusedRoute\.current===initialRouteId/u,
 'The editor must not overwrite unsaved narrator edits after library refresh');
assert.match(routeEditor,/setRouteDraft\(fromChain\(saved\)\)/u,
 'The manual editor reuses the saved narrator identities and branches');
console.log('PASS independent Qurra navigation and saved route continuation editing');
