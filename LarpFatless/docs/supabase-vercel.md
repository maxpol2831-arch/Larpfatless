# Supabase для LarpFatless PWA

## 1. Auth

1. Создайте проект в Supabase.
2. Откройте **Authentication -> Sign In / Providers -> Email**.
3. Включите **Email provider**.
4. Подтверждение email можно оставить включённым: приложение обрабатывает callback `/auth/callback`.

## 2. URL Configuration

Откройте **Authentication -> URL Configuration**.

В поле **Site URL** укажите production-домен Vercel:

```text
https://larpfatless.vercel.app
```

Если у проекта другой домен, используйте именно его.

В **Redirect URLs** добавьте:

```text
https://larpfatless.vercel.app/auth/callback
https://larpfatless.vercel.app/**
http://localhost:5173/auth/callback
http://localhost:5173/**
```

Для preview-деплоев Vercel можно добавить wildcard с вашим team/account slug:

```text
https://*-ssacaii.vercel.app/**
```

Важно: URL из `emailRedirectTo` должен быть разрешён в Supabase, иначе ссылка подтверждения email откроется с ошибкой.

## 3. Таблицы и RLS

Откройте **SQL Editor** и выполните:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  gender text not null,
  age integer not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  activity_level text not null,
  goal text not null,
  weekly_weight_change_kg numeric not null,
  daily_calories integer not null,
  protein_goal integer not null,
  fat_goal integer not null,
  carbs_goal integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  input_type text not null,
  source_text text not null default '',
  items jsonb not null default '[]'::jsonb,
  total jsonb not null default '{}'::jsonb,
  assistant_message text
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  assistant_enabled boolean not null default true,
  language text not null default 'ru',
  units text not null default 'kg',
  notifications boolean not null default false,
  nickname text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists meals_user_id_created_at_idx
  on public.meals (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "meals select own" on public.meals;
drop policy if exists "meals insert own" on public.meals;
drop policy if exists "meals update own" on public.meals;
drop policy if exists "meals delete own" on public.meals;
drop policy if exists "settings select own" on public.user_settings;
drop policy if exists "settings insert own" on public.user_settings;
drop policy if exists "settings update own" on public.user_settings;

create policy "profiles select own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles insert own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles update own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "meals select own"
on public.meals for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "meals insert own"
on public.meals for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "meals update own"
on public.meals for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "meals delete own"
on public.meals for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "settings select own"
on public.user_settings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "settings insert own"
on public.user_settings for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "settings update own"
on public.user_settings for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

## 4. Environment Variables в Vercel

Добавьте в **Vercel -> Project -> Settings -> Environment Variables**:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

`VITE_SUPABASE_PUBLISHABLE_KEY` можно использовать во фронтенде. Не добавляйте `service_role` или secret key в переменные с префиксом `VITE_`.

## 5. После изменения настроек

1. Сделайте **Redeploy** в Vercel.
2. Откройте сайт.
3. Создайте аккаунт.
4. Подтвердите email по ссылке из письма.
5. После возврата в приложение заполните профиль.
6. Добавьте еду в дневник.
7. Проверьте в Supabase **Table Editor**, что строки появились в `profiles`, `meals`, `user_settings`.
