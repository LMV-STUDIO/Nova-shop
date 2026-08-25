-- Las funciones internas de autenticación/vinculación se ejecutan mediante triggers.
-- No deben poder invocarse como RPC desde el API público.

revoke execute on function public.crear_usuario_desde_auth() from public, anon, authenticated;
revoke execute on function public.vincular_negocio_por_email() from public, anon, authenticated;
