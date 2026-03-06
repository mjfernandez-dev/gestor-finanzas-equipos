-- =============================================
-- FIX: Recursión infinita en políticas RLS
-- =============================================

-- Función security definer para verificar si el usuario es admin
-- Corre con privilegios del owner (bypassa RLS), evitando recursión
create or replace function public.is_group_admin(p_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and role = 'admin'
  )
$$ language sql security definer stable;

-- Función para verificar si el usuario es miembro de un grupo
create or replace function public.is_group_member(p_group_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  )
$$ language sql security definer stable;

-- Reemplazar políticas recursivas de group_members
drop policy if exists "group_members_select" on public.group_members;
drop policy if exists "group_members_insert" on public.group_members;
drop policy if exists "group_members_update" on public.group_members;

create policy "group_members_select" on public.group_members
  for select using (public.is_group_member(group_id));

create policy "group_members_insert" on public.group_members
  for insert with check (
    public.is_group_admin(group_id)
    or auth.uid() = user_id
  );

create policy "group_members_update" on public.group_members
  for update using (public.is_group_admin(group_id));

-- Reemplazar políticas recursivas de groups
drop policy if exists "groups_select" on public.groups;
drop policy if exists "groups_update" on public.groups;

create policy "groups_select" on public.groups
  for select using (public.is_group_member(id));

create policy "groups_update" on public.groups
  for update using (public.is_group_admin(id));

-- Reemplazar políticas recursivas de transactions
drop policy if exists "transactions_select" on public.transactions;
drop policy if exists "transactions_insert" on public.transactions;
drop policy if exists "transactions_update" on public.transactions;

create policy "transactions_select" on public.transactions
  for select using (public.is_group_member(group_id));

create policy "transactions_insert" on public.transactions
  for insert with check (public.is_group_member(group_id));

create policy "transactions_update" on public.transactions
  for update using (public.is_group_admin(group_id));
