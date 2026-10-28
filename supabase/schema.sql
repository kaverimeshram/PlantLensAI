-- PlantLens AI - Production PostgreSQL Database Schema for Supabase
-- Enables authenticated user accounts, private plant collections, observations, and care reminders
-- Enforces strict Row Level Security (RLS) so users can NEVER view or alter other users' private botanical data.

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table (Linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  growing_zone text default 'Maharashtra, India',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Saved Plants Collection Table
create table if not exists public.plants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  scientific_name text not null,
  nickname text,
  category text not null,
  image_url text,
  location text default 'Living Room' not null,
  watering_frequency_days integer default 7 not null,
  last_watered_date date default current_date not null,
  sunlight_requirement text default 'Bright Indirect' not null,
  health_status text default 'healthy' not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index user_id for fast collection lookups
create index if not exists plants_user_id_idx on public.plants(user_id);

-- Enable Row Level Security (RLS) on plants
alter table public.plants enable row level security;

create policy "Users can select own plants"
  on public.plants for select
  using (auth.uid() = user_id);

create policy "Users can insert own plants"
  on public.plants for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plants"
  on public.plants for update
  using (auth.uid() = user_id);

create policy "Users can delete own plants"
  on public.plants for delete
  using (auth.uid() = user_id);

-- 4. Plant Observations & Health Timeline Table
create table if not exists public.plant_timeline (
  id uuid primary key default uuid_generate_v4(),
  plant_id uuid not null references public.plants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'scan' | 'observation' | 'photo' | 'diagnosis' | 'water'
  title text not null,
  note text not null,
  image_url text,
  health_score integer,
  event_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists plant_timeline_plant_id_idx on public.plant_timeline(plant_id);
create index if not exists plant_timeline_user_id_idx on public.plant_timeline(user_id);

-- Enable RLS on plant_timeline
alter table public.plant_timeline enable row level security;

create policy "Users can select own plant timeline"
  on public.plant_timeline for select
  using (auth.uid() = user_id);

create policy "Users can insert own plant timeline"
  on public.plant_timeline for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own plant timeline"
  on public.plant_timeline for delete
  using (auth.uid() = user_id);

-- 5. Care Reminders Table
create table if not exists public.care_reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plant_id uuid references public.plants(id) on delete cascade,
  plant_name text not null,
  plant_nickname text,
  type text default 'water' not null, -- 'water' | 'fertilize' | 'mist' | 'repot'
  due_date text not null,
  frequency_days integer not null,
  completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists care_reminders_user_id_idx on public.care_reminders(user_id);

-- Enable RLS on care_reminders
alter table public.care_reminders enable row level security;

create policy "Users can select own reminders"
  on public.care_reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert own reminders"
  on public.care_reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reminders"
  on public.care_reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete own reminders"
  on public.care_reminders for delete
  using (auth.uid() = user_id);

-- 6. Trigger to automatically create profile entry on auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
