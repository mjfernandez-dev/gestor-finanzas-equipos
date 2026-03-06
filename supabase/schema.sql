-- =============================================
-- GESTOR DE FINANZAS PARA EQUIPOS AMATEUR
-- Schema v1 - MVP
-- =============================================

-- Profiles (extiende auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Groups
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  payment_alias text,
  invite_token text unique default encode(gen_random_bytes(16), 'hex') not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- GroupMembers
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade,
  display_name text not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  is_virtual boolean default false not null,
  created_at timestamptz default now() not null
);

-- Transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  member_id uuid references public.group_members(id) on delete cascade not null,
  type text check (type in ('debit', 'credit')) not null,
  amount numeric(10, 2) not null,
  description text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'approved' not null,
  payment_method text check (payment_method in ('transfer', 'cash')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.transactions enable row level security;

-- Profiles: cada usuario ve y edita solo su propio perfil
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- Groups: solo miembros del grupo pueden verlo
create policy "groups_select" on public.groups
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

create policy "groups_insert" on public.groups
  for insert with check (auth.uid() = created_by);

create policy "groups_update" on public.groups
  for update using (
    exists (
      select 1 from public.group_members
      where group_id = groups.id and user_id = auth.uid() and role = 'admin'
    )
  );

-- GroupMembers: miembros del grupo pueden ver los demás miembros
create policy "group_members_select" on public.group_members
  for select using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
    )
  );

create policy "group_members_insert" on public.group_members
  for insert with check (
    -- admin puede agregar miembros
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'admin'
    )
    -- o el propio usuario se une via invite
    or auth.uid() = user_id
  );

create policy "group_members_update" on public.group_members
  for update using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'admin'
    )
  );

-- Transactions: miembros del grupo pueden ver transacciones
create policy "transactions_select" on public.transactions
  for select using (
    exists (
      select 1 from public.group_members
      where group_id = transactions.group_id and user_id = auth.uid()
    )
  );

create policy "transactions_insert" on public.transactions
  for insert with check (
    exists (
      select 1 from public.group_members
      where group_id = transactions.group_id and user_id = auth.uid()
    )
  );

create policy "transactions_update" on public.transactions
  for update using (
    exists (
      select 1 from public.group_members
      where group_id = transactions.group_id and user_id = auth.uid() and role = 'admin'
    )
  );

-- =============================================
-- FUNCIÓN: buscar grupo por invite_token (omite RLS intencionalmente)
-- Solo devuelve id y name para no exponer datos sensibles del grupo
-- =============================================

create or replace function public.get_group_by_invite_token(p_token text)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name
  from public.groups g
  where g.invite_token = p_token
  limit 1;
$$;

-- =============================================
-- TRIGGER: crear perfil automaticamente al registrarse
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
