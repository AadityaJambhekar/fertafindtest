-- Run in Supabase SQL Editor before enabling accounts in production.
create type public.account_role as enum ('farmer', 'supplier', 'admin');
create type public.supplier_status as enum ('pending', 'approved', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.account_role not null default 'farmer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null,
  email text not null,
  phone text,
  website text,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  delivery_radius_km integer not null check (delivery_radius_km between 1 and 1000),
  description text,
  status public.supplier_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  product_name text not null,
  nitrogen_percent numeric(5,2) not null check (nitrogen_percent between 0 and 100),
  phosphorus_percent numeric(5,2) not null check (phosphorus_percent between 0 and 100),
  potassium_percent numeric(5,2) not null check (potassium_percent between 0 and 100),
  package_kg numeric(10,2),
  price_per_unit numeric(12,2),
  delivery_per_tonne numeric(12,2),
  currency text not null default 'USD',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analyses (
  id uuid primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_products enable row level security;
alter table public.analyses enable row level security;

create policy "users view their profile" on public.profiles for select using (auth.uid() = id);
create policy "users update their profile" on public.profiles for update using (auth.uid() = id);
create policy "users create their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "approved suppliers are public" on public.suppliers for select using (status = 'approved' or auth.uid() = owner_id);
create policy "owners create supplier" on public.suppliers for insert with check (auth.uid() = owner_id);
create policy "owners update supplier" on public.suppliers for update using (auth.uid() = owner_id);
create policy "approved supplier products are public" on public.supplier_products for select using (
  exists (select 1 from public.suppliers s where s.id = supplier_id and (s.status = 'approved' or s.owner_id = auth.uid()))
);
create policy "supplier owners manage products" on public.supplier_products for all using (
  exists (select 1 from public.suppliers s where s.id = supplier_id and s.owner_id = auth.uid())
) with check (
  exists (select 1 from public.suppliers s where s.id = supplier_id and s.owner_id = auth.uid())
);
create policy "owners manage their analyses" on public.analyses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();
