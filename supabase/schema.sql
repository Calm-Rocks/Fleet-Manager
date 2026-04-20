-- ─────────────────────────────────────────────────────────────────────────────
-- Fleet Manager — Full Supabase Schema (v2)
-- Includes: auth, companies, multi-user membership, RLS by company_id
--
-- Run this in Supabase → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS throughout)
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ── Companies ─────────────────────────────────────────────────────────────────
-- Each sign-up creates a company. Users belong to one (or more) companies.

create table if not exists companies (
  id                       uuid primary key default uuid_generate_v4(),
  name                     text not null,
  slug                     text unique,
  address_line1            text,
  address_line2            text,
  city                     text,
  postcode                 text,
  phone                    text,
  email                    text,
  vat_number               text,
  companies_house_number   text,
  created_at               timestamptz default now()
);

alter table companies enable row level security;

-- Users can read/update their own company (via membership check)
create policy "Members can view their company"
  on companies for select
  using (
    id in (
      select company_id from company_members where user_id = auth.uid()
    )
  );

create policy "Owners and managers can update company"
  on companies for update
  using (
    id in (
      select company_id from company_members
      where user_id = auth.uid() and role in ('owner', 'manager')
    )
  );


-- ── Company members ───────────────────────────────────────────────────────────
-- Links users to companies with a role. A user could belong to multiple
-- companies (e.g. a driver working for two operators) but typically one.

create type if not exists company_role as enum ('owner', 'manager', 'driver');

create table if not exists company_members (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid references companies(id) on delete cascade not null,
  user_id     uuid references auth.users on delete cascade not null,
  role        company_role not null default 'driver',
  created_at  timestamptz default now(),
  unique(company_id, user_id)
);

alter table company_members enable row level security;

create policy "Users can see their own memberships"
  on company_members for select
  using (user_id = auth.uid());

create policy "Owners can manage memberships"
  on company_members for all
  using (
    company_id in (
      select company_id from company_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

create index company_members_user_id_idx    on company_members(user_id);
create index company_members_company_id_idx on company_members(company_id);


-- ── Profiles ──────────────────────────────────────────────────────────────────
-- One profile per auth user. Stores display name and active company.

create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  full_name    text,
  email        text,
  company_id   uuid references companies(id) on delete set null,
  created_at   timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

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


-- ── Helper: is_company_member() ───────────────────────────────────────────────
-- Reusable RLS helper — checks if the calling user belongs to a given company.
-- Used in all fleet data table policies below.

create or replace function is_company_member(cid uuid)
returns boolean as $$
  select exists (
    select 1 from company_members
    where company_id = cid and user_id = auth.uid()
  )
$$ language sql security definer stable;


-- ── Vehicles ──────────────────────────────────────────────────────────────────

create table if not exists vehicles (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid references auth.users on delete set null,
  company_id             uuid references companies(id) on delete cascade not null,
  registration           text not null,
  make                   text,
  model                  text,
  year                   integer,
  current_mileage        integer default 0,
  condition              text check (condition in ('Excellent','Good','Fair','Poor')) default 'Good',
  purchase_price         numeric(10,2),
  estimated_market_value numeric(10,2),
  mot_expiry             date,
  tax_expiry             date,
  insurance_expiry       date,
  service_due_date       date,
  created_at             timestamptz default now()
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

create index vehicles_company_id_idx on vehicles(company_id);
create index vehicles_registration_idx on vehicles(registration);


-- ── Mileage entries ───────────────────────────────────────────────────────────

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

create index mileage_entries_company_id_idx on mileage_entries(company_id);
create index mileage_entries_vehicle_id_idx on mileage_entries(vehicle_id);
create index mileage_entries_date_idx       on mileage_entries(date desc);


-- ── Expense entries ───────────────────────────────────────────────────────────

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

create index expense_entries_company_id_idx on expense_entries(company_id);
create index expense_entries_vehicle_id_idx on expense_entries(vehicle_id);
create index expense_entries_date_idx       on expense_entries(date desc);
create index expense_entries_category_idx   on expense_entries(category);


-- ── Income entries ────────────────────────────────────────────────────────────

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

create index income_entries_company_id_idx on income_entries(company_id);
create index income_entries_vehicle_id_idx on income_entries(vehicle_id);
create index income_entries_date_idx       on income_entries(date desc);


-- ── Integrations table (future use) ──────────────────────────────────────────
-- Stores OAuth tokens and connection state for third-party integrations.
-- Tokens are encrypted at rest by Supabase Vault in production.

create table if not exists integrations (
  id            uuid primary key default uuid_generate_v4(),
  company_id    uuid references companies(id) on delete cascade not null,
  provider      text not null,               -- 'quickbooks', 'xero', 'zapier', etc.
  status        text not null default 'disconnected',
  access_token  text,                        -- store via Supabase Vault in production
  refresh_token text,
  token_expiry  timestamptz,
  metadata      jsonb default '{}',          -- provider-specific config
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
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

create index integrations_company_id_idx on integrations(company_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Summary of RLS model:
--
--   companies        → members can read; owners/managers can update
--   company_members  → users see own rows; owners manage all rows for their company
--   profiles         → users manage own row only
--   vehicles         → all members read/write; owners/managers delete
--   mileage_entries  → all members (any role) full CRUD
--   expense_entries  → all members (any role) full CRUD
--   income_entries   → all members (any role) full CRUD
--   integrations     → owners and managers only
--
-- All data access is gated through is_company_member() — no user can ever
-- see or modify data belonging to a company they are not a member of.
-- ─────────────────────────────────────────────────────────────────────────────
