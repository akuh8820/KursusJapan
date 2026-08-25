-- ============================================================
-- F0 Fondasi — Skema awal (Supabase / PostgreSQL)
-- App kursus bahasa Jepang standar JLPT ("Fasih", placeholder)
-- Jalankan dengan: supabase db push  (atau tempel di SQL Editor)
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- profiles: profil publik user (dibuat otomatis saat signup)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  target_level text not null default 'N5'
    check (target_level in ('N5','N4','N3','N2','N1')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profil bisa dibaca pemiliknya"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profil bisa diubah pemiliknya"
  on public.profiles for update
  using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', null));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- lessons: konten pelajaran (ditulis oleh pipeline konten)
-- Struktur lengkap ada di kolom `content` (jsonb, tervalidasi
-- oleh quality gate sebelum publish — lihat scripts/quality-gate)
-- ------------------------------------------------------------
create table public.lessons (
  id text primary key,                -- format: n5-u001
  level text not null check (level in ('N5','N4','N3','N2','N1')),
  unit_no int not null,
  theme text not null,                -- tema kehidupan nyata, mis. "Cari kos di Osaka"
  title text not null,                -- judul tampil (Bahasa Indonesia)
  duration_min int not null default 20,
  status text not null default 'draft'
    check (status in ('draft','review','published')),
  content jsonb not null,
  audio_status text not null default 'pending'
    check (audio_status in ('pending','ready')),
  curated_by text,
  changelog jsonb not null default '[]',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (level, unit_no)
);

comment on table public.lessons is
  'Konten pelajaran multi-indra. Publish hanya lewat quality gate (PRD §9.2).';

alter table public.lessons enable row level security;

create policy "pelajaran published bisa dibaca siapa pun"
  on public.lessons for select
  using (status = 'published');

create index lessons_level_status_idx on public.lessons (level, status, unit_no);

-- ------------------------------------------------------------
-- daily_cards: konten kartu "Kata hari ini / Fakta hari ini"
-- ------------------------------------------------------------
create table public.daily_cards (
  card_date date primary key,
  kind text not null check (kind in ('kata','fakta')),
  jp text not null,
  romaji text not null,
  meaning_id text not null,
  note_id text
);

alter table public.daily_cards enable row level security;

create policy "kartu harian bisa dibaca siapa pun"
  on public.daily_cards for select
  using (true);

-- ------------------------------------------------------------
-- SRS: antrean & riwayat review (SM-2 dan turunannya, PRD §7.3)
-- ------------------------------------------------------------
create table public.srs_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references public.lessons (id),
  item_key text not null,             -- mis. "vocab:yane" / "kanji:家"
  item_type text not null
    check (item_type in ('vocab','kanji','kana','sentence')),
  ease real not null default 2.5,
  interval_days real not null default 0,
  repetitions int not null default 0,
  lapses int not null default 0,
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id, item_key)
);

alter table public.srs_queue enable row level security;

create policy "antrean srs milik user terkait"
  on public.srs_queue for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index srs_queue_due_idx on public.srs_queue (user_id, due_at);

create table public.srs_reviews (
  id bigint generated always as identity primary key,
  queue_item_id uuid not null references public.srs_queue (id) on delete cascade,
  grade smallint not null check (grade between 0 and 5),
  ms_elapsed int,
  reviewed_at timestamptz not null default now()
);

alter table public.srs_reviews enable row level security;

create policy "riwayat review milik user terkait"
  on public.srs_reviews for all
  using (
    exists (
      select 1 from public.srs_queue q
      where q.id = queue_item_id and q.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.srs_queue q
      where q.id = queue_item_id and q.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Siklus Pomodoro & progres harian (PRD §6)
-- ------------------------------------------------------------
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text references public.lessons (id),
  focus_seconds int not null default 1200,
  break_seconds int not null default 300,
  pause_count int not null default 0,   -- maks 1x per fase fokus
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.study_sessions enable row level security;

create policy "sesi belajar milik user terkait"
  on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index study_sessions_user_day_idx
  on public.study_sessions (user_id, started_at);

create table public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_completed_date date,
  freezes_left int not null default 1
);

alter table public.user_stats enable row level security;

create policy "statistik milik user terkait"
  on public.user_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Laporan kesalahan konten dari user (mitigasi risiko PRD §14)
-- ------------------------------------------------------------
create table public.error_reports (
  id bigint generated always as identity primary key,
  lesson_id text references public.lessons (id),
  user_id uuid references auth.users (id) on delete set null,
  message text not null,
  context jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.error_reports enable row level security;

create policy "siapa pun boleh melapor kesalahan"
  on public.error_reports for insert
  with check (true);
