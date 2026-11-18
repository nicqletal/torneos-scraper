begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,raw_user_meta_data) values
 ('a0000000-0000-0000-0000-000000000001','admin-complete@test.local','{"display_name":"Admin"}'),
 ('a0000000-0000-0000-0000-000000000002','captain-complete@test.local','{"display_name":"Capitán"}'),
 ('a0000000-0000-0000-0000-000000000003','rival-complete@test.local','{"display_name":"Rival"}'),
 ('a0000000-0000-0000-0000-000000000004','member-complete@test.local','{"display_name":"Jugador"}'),
 ('a0000000-0000-0000-0000-000000000005','other-complete@test.local','{"display_name":"Ajeno"}');
insert into public.admins(user_id) values('a0000000-0000-0000-0000-000000000001');
update public.profile_contacts set whatsapp='5491123456789' where user_id in('a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003');
insert into public.teams(id,name,zone_id,modality,level) values
 ('b0000000-0000-0000-0000-000000000001','Equipo A','palermo','futbol_5','recreativo'),
 ('b0000000-0000-0000-0000-000000000002','Equipo B','palermo','futbol_5','recreativo');
insert into public.team_members(team_id,user_id,is_captain) values
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',true),
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000004',false),
 ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003',true);
insert into public.matches(id,range) values
 ('c0000000-0000-0000-0000-000000000001',tstzrange(now()-interval '54 hours',now()-interval '52 hours','[)')),
 ('c0000000-0000-0000-0000-000000000002',tstzrange(now()+interval '10 hours',now()+interval '12 hours','[)'));
insert into public.match_sides(match_id,team_id) select m.id,t.id from public.matches m cross join public.teams t
 where m.id in('c0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000002') and t.id in('b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002');
create function pg_temp.login(p_user uuid,p_aal text default 'aal1') returns void language sql as $$
 select set_config('request.jwt.claims',json_build_object('sub',p_user,'role','authenticated','aal',p_aal)::text,true);
$$;
grant execute on function pg_temp.login(uuid,text) to authenticated;

set local role authenticated;
select pg_temp.login('a0000000-0000-0000-0000-000000000001');
select is(public.is_admin(),true,'el rol existe antes de verificar MFA');
select is(public.is_verified_admin(),false,'AAL1 no concede Administración');
select is((select count(*)::integer from public.admin_actions),0,'AAL1 no lee auditoría');
select throws_ok($$select public.admin_search_users('Cap')$$,'42501','Acceso denegado','RPC de cuentas exige segundo factor');
select throws_ok($$select public.admin_team_review('b0000000-0000-0000-0000-000000000001')$$,'42501','Acceso denegado','comentarios privados exigen segundo factor');
select pg_temp.login('a0000000-0000-0000-0000-000000000005','aal2');
select is(public.is_verified_admin(),false,'AAL2 sin rol tampoco concede Administración');
select throws_ok($$select public.suspend_account('a0000000-0000-0000-0000-000000000002',7,'Prueba')$$,'42501','Acceso denegado','usuario común no sanciona');
select pg_temp.login('a0000000-0000-0000-0000-000000000001','aal2');
select is(public.is_verified_admin(),true,'rol y AAL2 conceden Administración');
select lives_ok($$select public.admin_search_users('Cap')$$,'Administrador consulta cuentas');
select lives_ok($$select public.update_site_settings('soporte@example.org','Ayuda','Consultanos','https://example.org/ayuda',(select updated_at from public.site_settings))$$,'configuración válida se guarda');
select is((select count(*)::integer from public.admin_actions where action='configuracion_actualizada'),1,'configuración se audita en la misma transacción');
select throws_ok($$select public.update_site_settings('soporte@example.org','Ayuda','','javascript:alert(1)',now())$$,'22023','Revisá el correo, el título y el enlace HTTPS de ayuda','enlace ejecutable rechazado en base');
select throws_ok($$select public.update_site_settings('soporte@example.org','Ayuda','','',now()-interval '1 day')$$,'40001','Otra persona cambió la configuración. Recargá antes de guardar','se evita pisar configuración concurrente');
select throws_ok($$update public.site_settings set support_email='otro@example.org'$$,'42501',null,'sin escrituras directas a configuración');

select pg_temp.login('a0000000-0000-0000-0000-000000000004');
select is(public.can_report_team('b0000000-0000-0000-0000-000000000002'),true,'integrante actual con Partido Jugado puede reportar');
select lives_ok($$select public.report_team('b0000000-0000-0000-0000-000000000002','violencia','Hechos comprobables')$$,'se registra reporte de Equipo');
select throws_ok($$select public.report_team('b0000000-0000-0000-0000-000000000002','violencia','Duplicado')$$,'23505',null,'no se duplica un reporte pendiente');
select is((select count(*)::integer from public.team_reports),1,'el autor consulta su reporte');
select lives_ok($$select public.create_support_thread('Consulta','Necesito ayuda')$$,'usuario abre consulta');
select is((select count(*)::integer from public.support_threads),1,'consulta propia visible');
select pg_temp.login('a0000000-0000-0000-0000-000000000005');
select is(public.can_report_team('b0000000-0000-0000-0000-000000000002'),false,'un ajeno no reporta');
select is((select count(*)::integer from public.team_reports),0,'un ajeno no lee reportes');
select is((select count(*)::integer from public.support_threads),0,'un ajeno no lee conversaciones');
select throws_ok($$select public.report_team('b0000000-0000-0000-0000-000000000002','violencia','No jugué')$$,'42501','Para reportar, tenés que integrar un Equipo con un Partido Jugado contra este rival','RPC repite elegibilidad');
select pg_temp.login('a0000000-0000-0000-0000-000000000001','aal2');
select lives_ok($$select public.send_support_message((select id from public.support_threads limit 1),'Respuesta de soporte')$$,'Administrador responde');
select is((select count(*)::integer from public.admin_actions where action='respuesta_soporte'),1,'respuesta queda auditada');
select is((select count(*)::integer from public.notices where user_id='a0000000-0000-0000-0000-000000000004' and kind='admin_message'),1,'respuesta crea Aviso canónico');
select lives_ok($$select public.close_support_thread((select id from public.support_threads limit 1))$$,'Administrador cierra');
select is((select count(*)::integer from public.admin_actions where action='cierre_soporte'),1,'cierre auditado');
select lives_ok($$select public.resolve_team_report((select id from public.team_reports limit 1),'descartado')$$,'se descarta un reporte');
select pg_temp.login('a0000000-0000-0000-0000-000000000004');
select lives_ok($$select public.send_support_message((select id from public.support_threads limit 1),'Otro mensaje')$$,'usuario reabre respondiendo');
select is((select count(*)::integer from public.support_threads where closed_at is null),1,'consulta reabierta');
select lives_ok($$select public.report_team('b0000000-0000-0000-0000-000000000002','violencia','Hechos nuevos')$$,'tras resolución permite nuevo reporte');
select pg_temp.login('a0000000-0000-0000-0000-000000000001','aal2');
select throws_ok($$select public.suspend_account('a0000000-0000-0000-0000-000000000001',7,'Prueba')$$,'42501','Las cuentas administrativas no se suspenden desde el panel','cuentas administrativas protegidas');
select lives_ok($$select public.resolve_team_report((select id from public.team_reports where resolution is null limit 1),'suspension','a0000000-0000-0000-0000-000000000003',7,'Responsable identificado tras revisar los hechos')$$,'resuelve y sanciona cuenta explícita');
select is((select count(*)::integer from public.team_reports where resolution is null),0,'se resolvió el reporte elegido');
select is((select count(*)::integer from public.account_suspensions),1,'sanción conservada');
select is((select administrative_drop from public.matches where id='c0000000-0000-0000-0000-000000000002'),true,'Partido futuro cae administrativamente');
select is((select public.match_drop_fault(m) from public.matches m where id='c0000000-0000-0000-0000-000000000002'),false,'no genera Falta aunque falten diez horas');
select is((select public.match_phase(m,now()) from public.matches m where id='c0000000-0000-0000-0000-000000000001'),'jugado','Partido Jugado anterior se conserva');
select throws_ok($$select public.suspend_account('a0000000-0000-0000-0000-000000000003',30,'Segunda sanción')$$,'P0001','Levantá la Suspensión vigente antes de aplicar una nueva','no superpone sanciones');
select pg_temp.login('a0000000-0000-0000-0000-000000000003');
select throws_ok($$select public.create_team('Otro equipo','palermo','futbol_5','recreativo')$$,'42501',null,'suspendido no crea Equipo por RPC');
select throws_ok($$select public.transfer_captaincy('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000004')$$,'P0001',null,'transferencia a alguien fuera del Plantel sigue denegada');
select is((select count(*)::integer from public.account_suspensions),1,'suspendido consulta su sanción');
select pg_temp.login('a0000000-0000-0000-0000-000000000005');
select is((select count(*)::integer from public.account_suspensions),0,'ajeno no consulta sanción');
select pg_temp.login('a0000000-0000-0000-0000-000000000001','aal2');
select lives_ok($$select public.lift_suspension((select id from public.account_suspensions limit 1),'Revisión de sanción')$$,'se levanta con motivo');
select is((select count(*)::integer from public.account_suspensions where lifted_at is not null),1,'levantamiento conserva historial');
select is((select administrative_drop from public.matches where id='c0000000-0000-0000-0000-000000000002'),true,'levantar no reactiva el Partido');
select lives_ok($$select public.suspend_account('a0000000-0000-0000-0000-000000000003',null,'Nueva sanción indefinida')$$,'nueva sanción después de levantar la anterior');
select is((select count(*)::integer from public.account_suspensions),2,'no se pisa el historial');
select throws_ok($$insert into public.admin_actions(actor_id,action) values(auth.uid(),'inventado')$$,'42501',null,'sin escritura directa en auditoría');
reset role;
select * from finish();
rollback;
