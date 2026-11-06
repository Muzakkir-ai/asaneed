const fs=require('node:fs');
const {reviewedSharedBridge}=require('../.vercel/shared-bridge-tests/legacy/lib/sharedBridge.js');

const [input,mode,...extra]=process.argv.slice(2);
if(extra.length||mode&&mode!=='--apply')throw Error('Expected a review file and optional --apply. Default output rolls back.');
if(!input)throw Error('Pass a private JSON file containing source, people and reviewed identities.');
const {source,people,identities}=JSON.parse(fs.readFileSync(input,'utf8'));
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
if(!uuid.test(source?.id)||typeof source.body!=='string'||!Array.isArray(people))throw Error('Invalid source or registry.');
const review={version:1,sourceBody:source.body,identities};
const graph=reviewedSharedBridge(source,review,people);
if(!graph||identities.some(entry=>!uuid.test(entry.personId)))throw Error('Review must resolve every source name to one active narrator ID with evidence.');
const literal=value=>"convert_from(decode('"+Buffer.from(value,'utf8').toString('base64')+"', 'base64'), 'UTF8')";
const ids=[...new Set(identities.map(entry=>entry.personId))];
const title='من إبراهيم العُبيدي إلى ابن الجزري — فرعا السند';
process.stdout.write([
 'begin;',
 'set local standard_conforming_strings = on;',
 'do $$',
 'begin',
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
