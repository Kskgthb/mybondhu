-- ─────────────────────────────────────────────────────────────────────────────
-- site_visitors table — tracks all web traffic for the admin panel
-- Run this once in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.site_visitors (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  session_end   timestamptz,                        -- updated when user leaves
  user_agent    text,                               -- raw UA string
  ip_address    text,                               -- hashed or partial for privacy
  country       text,                               -- from IP geo-lookup
  city          text,
  referrer      text,                               -- where they came from
  page_path     text,                               -- which page they first landed on
  is_signed_in  boolean     not null default false, -- authenticated visitor?
  user_id       uuid        references public.profiles(id) on delete set null
);

-- Index for time-range queries
create index if not exists site_visitors_created_at_idx on public.site_visitors (created_at desc);
create index if not exists site_visitors_user_id_idx    on public.site_visitors (user_id);

-- Row Level Security: admins read all, service role inserts
alter table public.site_visitors enable row level security;

-- Allow authenticated admins to read
create policy "Admins can read site_visitors"
  on public.site_visitors for select
  using (auth.role() = 'authenticated');

-- Allow anyone (including anonymous) to insert (visitor tracking)
create policy "Anyone can insert visit"
  on public.site_visitors for insert
  with check (true);

-- Allow service role to update session_end
create policy "Service role can update session_end"
  on public.site_visitors for update
  using (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- Optional: seed a few demo rows so the chart is not empty immediately
-- ─────────────────────────────────────────────────────────────────────────────
-- insert into public.site_visitors (created_at, user_agent, country, city, is_signed_in)
-- values
--   (now() - interval '1 day',  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'India', 'Mumbai', true),
--   (now() - interval '2 days', 'Samsung SM-S911B Build/TP1A', 'Bangladesh', 'Dhaka', false),
--   (now() - interval '3 days', 'Tecno Mobile KH7', 'India', 'Delhi', true),
--   (now() - interval '4 days', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'India', 'Bengaluru', true),
--   (now() - interval '5 days', 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X)', 'United States', 'New York', false);
