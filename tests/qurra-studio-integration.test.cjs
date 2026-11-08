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
assert.match(workspace,/<SimpleRouteEditor key=\{editingChain.id\} library=\{library\} route=\{editingChain\}/u,
 'Manual route editing starts on the exact saved sanad rather than opening the full book editor');
assert.match(workspace,/const \[showAll,setShowAll\]=useState\(false\)/u,
 'Show one readable sanad by default and only expand the merged graph on request');
assert.match(workspace,/const \[stage,setStage\]=useState<QurraPageStage>\('all-ten'\)/u,
 'All ten readers have one combined overview by default');
assert.match(workspace,/id:'rawi-imam',name:'الرواة ← الأئمة'/u,
 'Reader to imam stage is directly accessible');
assert.match(workspace,/id:'imam-sahaba',name:'الأئمة ← الصحابة'/u,
 'Imam to companions stage is directly accessible');
assert.match(workspace,/id:'sahaba-prophet',name:'الصحابة ← النبي ﷺ'/u,
 'Companions to Prophet stage is directly accessible');
assert.doesNotMatch(workspace,/BookTariqBuilder/u,
 'The giant book management form is not embedded in the Qurra diagram workspace');
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

const simpleEditor=fs.readFileSync('app/studio/qurra-diagrams/SimpleRouteEditor.tsx','utf8');
assert.match(simpleEditor,/import NarratorPicker from/u,'The editor reuses the shared canonical narrator picker');
assert.match(simpleEditor,/revision:route.revision/u,'Saving uses the saved record revision');
assert.match(simpleEditor,/confirmed:false/u,'Editing invalidates approval pending review');
assert.match(simpleEditor,/branches:nodes/u,'Saving retains all branches, not only the visible one');
assert.match(simpleEditor,/if\(!persisted\|\|!equal\(persisted.branches,nodes\)\|\|persisted.confirmed\)/u,
 'A save verifies actual persistence before reporting success');
console.log('PASS focused Qurra route editor preserves canonical identities and all branch data');
