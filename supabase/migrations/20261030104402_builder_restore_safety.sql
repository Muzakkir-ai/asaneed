begin;
do $fix$ declare source text;begin
 source:=pg_get_functiondef('private.validate_builder_links()'::regprocedure);
 source:=replace(source,'id=new.book_id and not archived','id=new.book_id and (not archived or new.archived)');
 source:=replace(source,'book_id=new.book_id and not archived','book_id=new.book_id and (not archived or new.archived)');
 execute source;
 source:=pg_get_functiondef('public.attach_builder_route(uuid,jsonb,uuid)'::regprocedure);
 source:=replace(source,'owner<>''guest:''||extra::text','owner is distinct from ''guest:''||extra::text');
 source:=replace(source,'holding->>''builderRouteId''<>route.id::text','holding->>''builderRouteId'' is distinct from route.id::text');
 source:=replace(source,'holding->>''tariqNumber''<>route.route_code','holding->>''tariqNumber'' is distinct from route.route_code');
 source:=replace(source,'holding->>''qariId''<>route.qari_id','holding->>''qariId'' is distinct from route.qari_id');
 source:=replace(source,'holding->>''rawi''<>route.rawi','holding->>''rawi'' is distinct from route.rawi');
 source:=replace(source,'length(holding->>''personalChain'')<100','coalesce(length(holding->>''personalChain''),0)<100');
 execute source;
 source:=pg_get_functiondef('private.restore_application_backup(jsonb,boolean)'::regprocedure);
 execute replace(source,'return jsonb_build_object(''success''','perform setval(''public.builder_route_number'',greatest((select coalesce(max(route_code::integer),1000) from public.builder_chains), (select last_value from public.builder_route_number)),true); return jsonb_build_object(''success''');
end $fix$;
commit;
