-- Bloqueos recurrentes para la agenda de barbería.
-- Ejecutar una sola vez en Supabase SQL Editor.

create table if not exists public.bloqueos_recurrentes_barbero (
    id uuid primary key default gen_random_uuid(),
    negocio_id uuid not null references public.negocios(id) on delete cascade,
    barbero_id uuid not null references public.barberos(id) on delete cascade,
    dia_semana integer not null check (dia_semana between 0 and 6),
    hora_inicio time not null,
    hora_fin time not null,
    motivo text,
    activo boolean not null default true,
    created_at timestamptz not null default now(),
    constraint bloqueo_recurrente_horas_validas check (hora_fin > hora_inicio)
);

create index if not exists idx_bloqueos_recurrentes_negocio
    on public.bloqueos_recurrentes_barbero(negocio_id, barbero_id, dia_semana, activo);

alter table public.bloqueos_recurrentes_barbero enable row level security;

-- Clientes: pueden leer solamente bloqueos activos para que la plantilla pública
-- pueda ocultar esos horarios.
drop policy if exists "Clientes pueden ver bloqueos recurrentes activos" on public.bloqueos_recurrentes_barbero;
create policy "Clientes pueden ver bloqueos recurrentes activos"
on public.bloqueos_recurrentes_barbero
for select
to anon, authenticated
using (activo = true);

-- Dueños: pueden administrar los bloqueos de su propio negocio.
drop policy if exists "Dueños administran bloqueos recurrentes" on public.bloqueos_recurrentes_barbero;
create policy "Dueños administran bloqueos recurrentes"
on public.bloqueos_recurrentes_barbero
for all
to authenticated
using (
    exists (
        select 1
        from public.negocios n
        where n.id = bloqueos_recurrentes_barbero.negocio_id
          and n.dueño_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.negocios n
        where n.id = bloqueos_recurrentes_barbero.negocio_id
          and n.dueño_id = auth.uid()
    )
);
