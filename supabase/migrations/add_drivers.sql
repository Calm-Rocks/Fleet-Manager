-- ─────────────────────────────────────────────────────────────────────────────
-- Fleet Manager — Migration: Add drivers table
-- Run this in Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists drivers (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid references auth.users on delete set null,
  company_id           uuid references companies(id) on delete cascade not null,
  first_name           text not null,
  last_name            text not null,
  email                text,
  phone                text,
  date_of_birth        date,
  licence_number       text,
  licence_categories   text[],          -- array of category codes e.g. {'B','C','CE'}
  licence_expiry       date,
  licence_points       integer default 0 check (licence_points >= 0),
  medical_expiry       date,
  cpc_expiry           date,            -- Certificate of Professional Competence
  tacho_card_expiry    date,            -- Digital tachograph card
  assigned_vehicle_id  uuid references vehicles(id) on delete set null,
  notes                text,
  active               boolean not null default true,
  created_at           timestamptz default now()
);

alter table drivers enable row level security;

create policy "Company members can manage drivers"
  on drivers for all
  using (is_company_member(company_id));

do $$ begin
  create index drivers_company_id_idx on drivers(company_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index drivers_assigned_vehicle_idx on drivers(assigned_vehicle_id);
exception when duplicate_table then null; end $$;
do $$ begin
  create index drivers_active_idx on drivers(active);
exception when duplicate_table then null; end $$;
