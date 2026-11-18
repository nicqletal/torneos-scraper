"""Escenarios de bloqueo reales; exclusivamente contra Supabase local efímero."""
import json
import os
import queue
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

import psycopg

dsn = os.environ['ADMIN_TEST_DATABASE_URL']
if urlparse(dsn).hostname not in ('127.0.0.1', 'localhost'):
    raise RuntimeError('Esta prueba exige una base local')


def connect(user=None, aal='aal1'):
    db = psycopg.connect(dsn, autocommit=False)
    db.execute("set statement_timeout='8s'")
    if user:
        db.execute('set local role authenticated')
        db.execute("select set_config('request.jwt.claims',%s,true)",
                   (json.dumps({'sub': user, 'role': 'authenticated', 'aal': aal}),))
    return db


admin, target, other = [str(uuid.uuid4()) for _ in range(3)]
with connect() as setup:
    for person in (admin, target, other):
        setup.execute("insert into auth.users(id,email,raw_user_meta_data) values(%s,%s,%s::jsonb)",
                      (person, person + '@concurrency.test', '{"display_name":"Prueba concurrente"}'))
    setup.execute('insert into public.admins(user_id) values(%s)', (admin,))
    setup.execute("update public.profile_contacts set whatsapp='5491123456789' where user_id in(%s,%s)", (target, other))
    setup.execute("update public.site_settings set support_email='soporte@concurrency.test'")


def execute_waiting(user, aal, statement, params, started):
    try:
        with connect(user, aal) as db:
            started.put(db.info.backend_pid)
            db.execute(statement, params)
        return 'completed'
    except psycopg.Error as error:
        return error.sqlstate


def assert_waiting(started):
    pid = started.get(timeout=3)
    with psycopg.connect(dsn, autocommit=True) as observer:
        for _ in range(100):
            row = observer.execute('select wait_event_type from pg_stat_activity where pid=%s', (pid,)).fetchone()
            if row and row[0] == 'Lock':
                return
            time.sleep(0.02)
    raise AssertionError('La segunda operación no esperó el bloqueo esperado')


with ThreadPoolExecutor(max_workers=1) as pool:
    # Una creación que comienza antes de confirmar la sanción debe esperar y
    # volver a comprobarla; no alcanza con una consulta previa desde la UI.
    with connect(admin, 'aal2') as first:
        first.execute('select public.suspend_account(%s::uuid,7,%s)', (target, 'Primera decisión concurrente'))
        started = queue.Queue()
        pending = pool.submit(execute_waiting, target, 'aal1',
                              "select public.create_team('No debe nacer','palermo','futbol_5','recreativo')", (), started)
        assert_waiting(started)
        first.commit()
        assert pending.result(timeout=9) == '42501', 'Crear Equipo eludió una Suspensión concurrente'
    print('OK: crear Equipo espera y rechaza una Suspensión concurrente')

    # Dos decisiones simultáneas no pueden producir dos sanciones vigentes.
    with connect(admin, 'aal2') as first:
        first.execute('select public.suspend_account(%s::uuid,7,%s)', (other, 'Sanción concurrente inicial'))
        started = queue.Queue()
        pending = pool.submit(execute_waiting, admin, 'aal2',
                              'select public.suspend_account(%s::uuid,30,%s)', (other, 'Segunda decisión concurrente'), started)
        assert_waiting(started)
        first.commit()
        assert pending.result(timeout=9) == 'P0001', 'Se superpusieron sanciones de dos Administradores'
    with connect() as check:
        count = check.execute('select count(*) from public.account_suspensions where user_id=%s and lifted_at is null', (other,)).fetchone()[0]
        assert count == 1
    print('OK: dos Administradores no superponen Suspensiones vigentes')
