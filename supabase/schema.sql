-- ─────────────────────────────────────────────────────────────────────────────
-- Fleet Manager — Supabase Schema (v4)
-- Fix: removed recursive RLS policies on company_members
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ── 1. COMPANIES ──────────────────────────────────────────────────────────────

create table if not exists companies (
  id                      uuid primary key default uuid_generate_v4(),
  name                    text not null,
  slug                    text unique,
  address_line1           text,
  address_line2           text,
  city                    text,
  postcode                text,
  phone                   text,
  email                   text,
  vat_number              text,
  companies_house_number  text,
  created_at              timestamptz default now()
);

alter table companies enable row level security;


-- ── 2. COMPANY MEMBERS ────────────────────────────────────────────────────────

do $$ begin
  create type company_role as enum ('owner', 'manager', 'driver');
exception
  when duplicate_object then null;
end $$;

create table if not exists company_members (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid references companies(id) on delete cascade not null,
  user_id     uuid references auth.users on delete cascade not null,
  role        company_role not null default 'driver',
  created_at  timestamptz default now(),
  unique(company_id, user_id)
);

alter table company_members enable row level security;

-- KEY FIX: policies only check user_id = auth.uid() directly on the row —
-- no subquery back into company_members, so no infinite recursion.

create policy "Users can view own membership rows"
  on company_members for select
  using (user_id = auth.uid());

create policy "Users can insert own membership rows"
  on company_members for insert
  with check (user_id = auth.uid());

create policy "Users can update own membership rows"
  on company_members for update
  using (user_id = auth.uid());

create policy "Users can delete own membership rows"
  on company_members for delete
  using (user_id = auth.uid());

do $$ begin
  create index company_members_user_id_idx    on company_members(user_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index company_members_company_id_idx on company_members(company_id);
exception when duplicate_table then null; end $$;


-- ── 3. COMPANIES POLICIES ─────────────────────────────────────────────────────
-- Added after company_members exists so the subqueries are valid.

create policy "Members can view their company"
  on companies for select
  using (
    id in (
      select company_id from company_members
      where user_id = auth.uid()
    )
  );

create policy "Anyone can insert a company"
  on companies for insert
  with check (true);

create policy "Owners and managers can update company"
  on companies for update
  using (
    id in (
      select company_id from company_members
      where user_id = auth.uid() and role in ('owner', 'manager')
    )
  );


-- ── 4. PROFILES ───────────────────────────────────────────────────────────────

create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  email       text,
  company_id  uuid references companies(id) on delete set null,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create a blank profile on every new sign-up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ── 5. HELPER FUNCTION ────────────────────────────────────────────────────────
-- security definer means it runs as the function owner (bypasses RLS)
-- so downstream table policies calling this won't recurse.

create or replace function is_company_member(cid uuid)
returns boolean as $$
  select exists (
    select 1 from company_members
    where company_id = cid and user_id = auth.uid()
  )
$$ language sql security definer stable;


-- ── 6. VEHICLES ───────────────────────────────────────────────────────────────

create table if not exists vehicles (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid references auth.users on delete set null,
  company_id              uuid references companies(id) on delete cascade not null,
  registration            text not null,
  make                    text,
  model                   text,
  year                    integer,
  current_mileage         integer default 0,
  condition               text check (condition in ('Excellent','Good','Fair','Poor')) default 'Good',
  purchase_price          numeric(10,2),
  estimated_market_value  numeric(10,2),
  mot_expiry              date,
  tax_expiry              date,
  insurance_expiry        date,
  service_due_date        date,
  created_at              timestamptz default now()
);

alter table vehicles enable row level security;

create policy "Company members can view vehicles"
  on vehicles for select
  using (is_company_member(company_id));

create policy "Company members can insert vehicles"
  on vehicles for insert
  with check (is_company_member(company_id));

create policy "Company members can update vehicles"
  on vehicles for update
  using (is_company_member(company_id));

create policy "Owners and managers can delete vehicles"
  on vehicles for delete
  using (
    company_id in (
      select company_id from company_members
      where user_id = auth.uid() and role in ('owner', 'manager')
    )
  );

do $$ begin
  create index vehicles_company_id_idx   on vehicles(company_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index vehicles_registration_idx on vehicles(registration);
exception when duplicate_table then null; end $$;


-- ── 7. MILEAGE ENTRIES ────────────────────────────────────────────────────────

create table if not exists mileage_entries (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users on delete set null,
  company_id     uuid references companies(id) on delete cascade not null,
  vehicle_id     uuid references vehicles(id) on delete cascade not null,
  date           date not null,
  start_mileage  integer not null,
  end_mileage    integer not null,
  total_mileage  integer generated always as (end_mileage - start_mileage) stored,
  notes          text,
  created_at     timestamptz default now(),
  constraint mileage_order check (end_mileage >= start_mileage)
);

alter table mileage_entries enable row level security;

create policy "Company members can manage mileage"
  on mileage_entries for all
  using (is_company_member(company_id));

do $$ begin
  create index mileage_entries_company_id_idx on mileage_entries(company_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index mileage_entries_vehicle_id_idx on mileage_entries(vehicle_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index mileage_entries_date_idx on mileage_entries(date desc);
exception when duplicate_table then null; end $$;


-- ── 8. EXPENSE ENTRIES ────────────────────────────────────────────────────────

create table if not exists expense_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users on delete set null,
  company_id  uuid references companies(id) on delete cascade not null,
  vehicle_id  uuid references vehicles(id) on delete cascade not null,
  date        date not null,
  category    text check (category in ('Fuel','Maintenance','Insurance','Tax','Repairs','Other')) not null,
  amount      numeric(10,2) not null check (amount >= 0),
  notes       text,
  created_at  timestamptz default now()
);

alter table expense_entries enable row level security;

create policy "Company members can manage expenses"
  on expense_entries for all
  using (is_company_member(company_id));

do $$ begin
  create index expense_entries_company_id_idx on expense_entries(company_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index expense_entries_vehicle_id_idx on expense_entries(vehicle_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index expense_entries_date_idx on expense_entries(date desc);
exception when duplicate_table then null; end $$;
do $$ begin
  create index expense_entries_category_idx on expense_entries(category);
exception when duplicate_table then null; end $$;


-- ── 9. INCOME ENTRIES ─────────────────────────────────────────────────────────

create table if not exists income_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users on delete set null,
  company_id  uuid references companies(id) on delete cascade not null,
  vehicle_id  uuid references vehicles(id) on delete cascade not null,
  date        date not null,
  source      text not null,
  amount      numeric(10,2) not null check (amount >= 0),
  notes       text,
  created_at  timestamptz default now()
);

alter table income_entries enable row level security;

create policy "Company members can manage income"
  on income_entries for all
  using (is_company_member(company_id));

do $$ begin
  create index income_entries_company_id_idx on income_entries(company_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index income_entries_vehicle_id_idx on income_entries(vehicle_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index income_entries_date_idx on income_entries(date desc);
exception when duplicate_table then null; end $$;


-- ── 10. INTEGRATIONS ──────────────────────────────────────────────────────────

create table if not exists integrations (
  id             uuid primary key default uuid_generate_v4(),
  company_id     uuid references companies(id) on delete cascade not null,
  provider       text not null,
  status         text not null default 'disconnected',
  access_token   text,
  refresh_token  text,
  token_expiry   timestamptz,
  metadata       jsonb default '{}',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(company_id, provider)
);

alter table integrations enable row level security;

create policy "Owners can manage integrations"
  on integrations for all
  using (
    company_id in (
      select company_id from company_members
      where user_id = auth.uid() and role in ('owner', 'manager')
    )
  );

do $$ begin
  create index integrations_company_id_idx on integrations(company_id);
exception when duplicate_table then null; end $$;
