begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,raw_user_meta_data) values
 ('d1000000-0000-0000-0000-000000000001','admin-visibility@test.local','{"display_name":"Administrador"}'),
 ('d1000000-0000-0000-0000-000000000002','author-visibility@test.local','{"display_name":"Autor"}'),
 ('d1000000-0000-0000-0000-000000000003','other-visibility@test.local','{"display_name":"Otro"}');
insert into public.admins(user_id) values('d1000000-0000-0000-0000-000000000001');
insert into public.tournaments(id,name,sport_modality,zone_id,inscription_deadline,start_date,end_date,user_id,contact_instagram)
 values('e1000000-0000-0000-0000-000000000001','Copa vigente','futbol_5','palermo',current_date+1,current_date+2,current_date+3,'d1000000-0000-0000-0000-000000000002','copa.test');
insert into storage.objects(bucket_id,name,owner_id) values
 ('flyers','e1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000002'),
 ('flyers','e1000000-0000-0000-0000-000000000099','d1000000-0000-0000-0000-000000000002');
set local storage.allow_delete_query='true';
create function pg_temp.login(p_user uuid,p_aal text default 'aal1') returns void language sql as $$
 select set_config('request.jwt.claims',json_build_object('sub',p_user,'role','authenticated','aal',p_aal)::text,true);
$$;
grant execute on function pg_temp.login(uuid,text) to authenticated;
set local role anon;
select is((select count(*)::integer from public.public_site_settings()),1,'Ayuda pública disponible sin exponer editor');
select throws_ok($$select * from public.site_settings$$,'42501',null,'anon no lee configuración interna');
select throws_ok($$select * from public.admin_actions$$,'42501',null,'anon no lee auditoría');
reset role;
set local role authenticated;
select pg_temp.login('d1000000-0000-0000-0000-000000000002');
select lives_ok($$select public.report_tournament('e1000000-0000-0000-0000-000000000001','datos_incorrectos','Revisar fechas')$$,'usuario presenta reporte de torneo');
select throws_ok($$select public.report_tournament('e1000000-0000-0000-0000-000000000001','datos_incorrectos','Duplicado')$$,'23505',null,'torneo admite una sola presentación por cuenta');
select lives_ok($$select public.create_support_thread('Consulta privada','Solo participantes')$$,'consulta para probar visibilidad de mensajes');
select is((select count(*)::integer from public.support_messages),1,'autor ve mensajes propios');
select pg_temp.login('d1000000-0000-0000-0000-000000000003');
select is((select count(*)::integer from public.tournament_reports),0,'ajeno no lee reporte de torneo');
select is((select count(*)::integer from public.support_messages),0,'ajeno no lee mensajes privados');
select is((select count(*)::integer from public.site_settings),0,'cuenta común no lee configuración interna');
select lives_ok($$select public.report_tournament('e1000000-0000-0000-0000-000000000001','no_es_torneo','Otra presentación')$$,'segunda cuenta presenta reporte independiente');
select pg_temp.login('d1000000-0000-0000-0000-000000000001');
select is((select count(*)::integer from public.tournament_reports),0,'administrador AAL1 no lee reportes ajenos');
select is((select count(*)::integer from public.support_messages),0,'administrador AAL1 no lee mensajes ajenos');
select is_empty($$delete from storage.objects where name='e1000000-0000-0000-0000-000000000099' returning id$$,'AAL1 no retira flyers huérfanos ajenos');
select pg_temp.login('d1000000-0000-0000-0000-000000000001','aal2');
select is((select count(*)::integer from public.support_messages),1,'administrador verificado ve mensajes de soporte');
select is_empty($$delete from storage.objects where name='e1000000-0000-0000-0000-000000000001' returning id$$,'administrador no retira flyer de torneo vigente');
select isnt_empty($$delete from storage.objects where name='e1000000-0000-0000-0000-000000000099' returning id$$,'administrador verificado retira solo el huérfano');
select lives_ok($$select public.resolve_tournament_report((select id from public.tournament_reports limit 1),'observado')$$,'observar resuelve los reportes pendientes del torneo');
select is((select count(*)::integer from public.tournament_reports where resolution='observado'),2,'ambos reportes quedan resueltos al observar');
select ok((select observed_at is not null from public.tournaments where id='e1000000-0000-0000-0000-000000000001'),'marca Observado guardada');
select lives_ok($$select public.unobserve_tournament('e1000000-0000-0000-0000-000000000001','Verificados los datos')$$,'quitar Observado requiere motivo y registra decisión');
select is((select count(*)::integer from public.admin_actions where action in('observar_torneo','quitar_observado')),2,'ambas decisiones auditadas');
select throws_ok($$insert into public.support_messages(thread_id,author_id,body) values(gen_random_uuid(),auth.uid(),'Falso')$$,'42501',null,'sin escritura directa de mensajes');
select throws_ok($$select public.record_admin_security_action('inventado')$$,'P0001','Evento inválido','auditoría de acceso rechaza vocabulario arbitrario');
reset role;
select * from finish();
rollback;
