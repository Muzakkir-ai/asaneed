-- Older backups predate additive non-null route metadata. Fill missing keys on restore.
-- Preserve the existing private admin-only function and all immutable-data guards.
do $compat$ declare source text; marker text:='if data ? ''builder_people'' then';begin
 source:=pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure);
 if position(marker in source)=0 then raise exception 'Builder restore hook unavailable';end if;
 execute replace(source,marker,marker||' data:=jsonb_set(data,''{builder_chains}'',coalesce((select jsonb_agg(''{"upper_route_name":"","branch_route_name":"","reading_scope":"unspecified"}''::jsonb||entry) from jsonb_array_elements(coalesce(data->''builder_chains'',''[]''::jsonb)) entry),''[]''::jsonb));');
end $compat$;
