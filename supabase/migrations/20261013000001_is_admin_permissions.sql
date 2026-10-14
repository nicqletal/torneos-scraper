-- Corrección adicional para bases que ya aplicaron 20261007000001.
-- Revocar solo anon no alcanza: cada rol conserva el EXECUTE de PUBLIC.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
