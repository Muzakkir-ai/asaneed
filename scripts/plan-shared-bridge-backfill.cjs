const fs=require('node:fs');
const {sanadKey}=require('../.vercel/shared-bridge-tests/legacy/lib/unifiedSanad.js');
const {reviewedSharedBridge}=require('../.vercel/shared-bridge-tests/legacy/lib/sharedBridge.js');

const [input,mode,...extra]=process.argv.slice(2);
if(extra.length||mode&&mode!=='--apply')throw Error('Expected a review file and optional --apply. Default output rolls back.');
if(!input)throw Error('Pass a private JSON file containing source, people and reviewed identities.');
const {source,people,identities,newPeople=[],ownerId}=JSON.parse(fs.readFileSync(input,'utf8'));
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
if(!uuid.test(source?.id)||typeof source.body!=='string'||!Array.isArray(people))throw Error('Invalid source or registry.');
if(!Array.isArray(newPeople)||newPeople.length&&!uuid.test(ownerId))throw Error('New narrators require a reviewed owner ID.');
const proposalKey=name=>sanadKey(name).replace(/^ابي /u,'ابو ').replace(/ھ/gu,'ه');
const registryNames=people.flatMap(person=>[person.name,person.display_name,...(person.aliases??[]).map(alias=>alias.name)]).filter(Boolean).map(proposalKey);
const newIds=new Set(),newKeys=new Set();
for(const person of newPeople){
 if(!uuid.test(person.id)||typeof person.name!=='string'||person.name!==person.name.trim()||person.name.length<2||person.name.length>250)throw Error('Invalid new narrator.');
 const key=proposalKey(person.name);
 const spellings=identities.filter(entry=>entry.personId===person.id).map(entry=>proposalKey(entry.name));
 if(!spellings.length||newIds.has(person.id)||people.some(saved=>saved.id===person.id)||newKeys.has(key)||[key,...spellings].some(name=>registryNames.includes(name)))throw Error('New narrator conflicts with the reviewed registry.');
 newIds.add(person.id);
 newKeys.add(key);
}
const review={version:1,sourceBody:source.body,identities};
const graph=reviewedSharedBridge(source,review,[...people,...newPeople.map(person=>({...person,archived:false}))]);
if(!graph||identities.some(entry=>!uuid.test(entry.personId)))throw Error('Review must resolve every source name to one active narrator ID with evidence.');
const literal=value=>"convert_from(decode('"+Buffer.from(value,'utf8').toString('base64')+"', 'base64'), 'UTF8')";
const ids=[...new Set(identities.map(entry=>entry.personId))];
const sqlId=id=>literal(id)+'::uuid';
const projection="jsonb_build_object('id',id,'name',name,'display_name',display_name,'aliases',aliases,'archived',archived)";
const snapshot=people.map(({id,name,display_name,aliases,archived})=>({id,name,display_name,aliases,archived})).sort((a,b)=>a.id.localeCompare(b.id));
const proposedIds=newPeople.map(person=>sqlId(person.id)).join(', ');
const createPeople=newPeople.flatMap(person=>{
 const values=[sqlId(person.id),sqlId(ownerId),literal(person.name),literal(sanadKey(person.name))];
 return [
  "  insert into public.builder_people(id,owner_id,name,search_key) values ("+values.join(', ')+") on conflict (id) do nothing;",
  "  if not exists(select 1 from public.builder_people where id="+values[0]+" and owner_id="+values[1]+" and name="+values[2]+" and search_key="+values[3]+" and not archived and display_name='' and aliases='[]'::jsonb) then raise exception 'Proposed narrator ID is already in use or changed'; end if;",
 ];
});
const title='من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند';
process.stdout.write([
 'begin;',
 'set local standard_conforming_strings = on;',
 'do $$',
 'begin',
 ...(newPeople.length?[
  '  lock table public.builder_people in share row exclusive mode;',
  "  if (select coalesce(jsonb_agg("+projection+" order by id),'[]'::jsonb) from public.builder_people where id not in ("+proposedIds+")) is distinct from "+literal(JSON.stringify(snapshot))+"::jsonb then raise exception 'Narrator registry changed since review'; end if;",
  ...createPeople,
 ]:[]),
 '  perform 1 from public.builder_people where id in ('+ids.map(id=>literal(id)+'::uuid').join(', ')+') and not archived for share;',
 '  if (select count(*) from public.builder_people where id in ('+ids.map(id=>literal(id)+'::uuid').join(', ')+') and not archived) <> '+ids.length+" then raise exception 'Narrator registry changed'; end if;",
 '  update public.workspace_records',
 "    set payload=jsonb_set(payload, '{sharedBridgeReview}', "+literal(JSON.stringify(review))+'::jsonb)',
 "    where id="+literal(source.id)+"::uuid and kind='sanadSections' and coalesce(payload->>'ownerId','')=''",
 "      and payload->>'title'="+literal(title)+" and payload->>'body'="+literal(source.body),
 "      and (not (payload ? 'sharedBridgeReview') or payload->'sharedBridgeReview'="+literal(JSON.stringify(review))+'::jsonb);',
 "  if not found then raise exception 'Shared source or review changed'; end if;",
 'end $$;',
 mode==='--apply'?'commit;':'rollback;',
 '',
].join('\n').replaceAll('$$', '$bridge_review$'));
