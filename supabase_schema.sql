-- ==============================================================================
-- ប្រព័ន្ធគ្រប់គ្រង និងស្រង់ទិន្នន័យបុគ្គលិកអប់រំ ស្រុកតាលោសែនជ័យ
-- SUPABASE DATABASE SCHEMA MIGRATION SCRIPT
-- ==============================================================================

-- 1. បង្កើតតារាង staff_members
create table if not exists public.staff_members (
  id bigint primary key,
  staff_id text,
  staff_type text not null default 'ក្របខណ្ឌ',
  name_kh text not null,
  name_en text,
  gender text not null default 'ស',
  gender_label text default 'ស្រី',
  dob text,
  
  -- ទីកន្លែងកំណើត ៤ កម្រិត
  pob_province text,
  pob_district text,
  pob_commune text,
  pob_village text,
  
  -- ព័ត៌មានក្របខណ្ឌ
  join_date text,
  tenure_date text,
  position text,
  rank_type text,
  rank_date text,
  
  -- បៀវត្ស និងប្រាក់វិភាជន៍
  base_salary numeric default 0,
  position_allowance numeric default 0,
  family_children numeric default 0,
  family_spouse numeric default 0,
  
  -- អង្គភាព និងភូមិសាស្ត្រ
  school_code text,
  school_name text,
  commune_code text,
  commune_name text,
  
  -- អត្តសញ្ញាណប័ណ្ណ និងទំនាក់ទំនង
  national_id text,
  id_issue_date text,
  id_expiry_date text,
  account_number text,
  phone text,
  note text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. បង្កើត Index ជួយសម្រួលការស្វែងរកឱ្យលឿន
create index if not exists idx_staff_name_kh on public.staff_members (name_kh);
create index if not exists idx_staff_id on public.staff_members (staff_id);
create index if not exists idx_staff_school on public.staff_members (school_name);
create index if not exists idx_staff_commune on public.staff_members (commune_code);

-- 3. បើកដំណើរការ Row Level Security (RLS)
alter table public.staff_members enable row level security;

-- 4. បង្កើត Policies អនុញ្ញាតឱ្យ Web Client (ប្រើ Public Anon Key) អាចអាន សរសេរ កែប្រែ និងលុបបាន
drop policy if exists "Allow public read access" on public.staff_members;
create policy "Allow public read access"
  on public.staff_members for select
  using (true);

drop policy if exists "Allow public insert access" on public.staff_members;
create policy "Allow public insert access"
  on public.staff_members for insert
  with check (true);

drop policy if exists "Allow public update access" on public.staff_members;
create policy "Allow public update access"
  on public.staff_members for update
  using (true);

drop policy if exists "Allow public delete access" on public.staff_members;
create policy "Allow public delete access"
  on public.staff_members for delete
  using (true);

-- 5. បើក Realtime Replication (ដើម្បី update ទិន្នន័យលើ web ភ្លាមៗពេលមានការកែប្រែ)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'staff_members'
  ) then
    alter publication supabase_realtime add table public.staff_members;
  end if;
end;
$$;
