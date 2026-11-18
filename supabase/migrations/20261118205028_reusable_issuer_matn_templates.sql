-- Authors opt in to reuse. Other issuing accounts receive SELECT access only.
create policy reusable_issuer_matn_templates
on public.workspace_records
for select to authenticated
using (
  kind = 'mutoonTextTemplates'
  and payload->>'reusable' = 'true'
  and coalesce(payload->>'status', 'published') = 'published'
  and private.is_staff()
);
