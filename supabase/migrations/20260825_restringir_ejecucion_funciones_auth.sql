-- Endurecer funciones internas de autenticación/vinculación.
-- Estas funciones son usadas por triggers internos y no deben exponerse
-- como RPC ejecutables por clientes anon/authenticated.

revoke execute on function public.crear_usuario_desde_auth() from anon, authenticated;
revoke execute on function public.vincular_negocio_por_email() from anon, authenticated;

-- Índice para las búsquedas de negocio por propietario.
create index if not exists idx_negocios_dueno_id
    on public.negocios("dueño_id");
