-- GRANT/REVOKE → decides whether you can perform an operation
-- RLS (USING / WITH CHECK) → decides which rows you can access or modify

create type public.supported_language as enum(
    'chinese',
    'japanese',
    'german',
    'korean'
);

create table if not exists public.profile (
    id uuid references auth.users primary key,
    full_name text,
    selected_language public.supported_language,
    selected_language_level text,
    motivations text[],
    interests text[],
    onboarding_completed boolean default false,
    is_premium boolean default false,
    premium_expires_at timestamp with time zone,
    updated_at timestamp with time zone default now()
);

alter table public.profile enable row level security;

create policy "User can read own profile"
on public.profile
for select
using (auth.uid() = id);

create policy "User can insert own profile"
on public.profile
for insert
-- RLS uses WITH CHECK to validate the new row being inserted
with check (auth.uid() = id);

create policy "User can update own profile"
on public.profile
for update
using (auth.uid() = id)
with check (auth.uid() = id);

revoke update on table public.profile from authenticated;
revoke insert on table public.profile from authenticated;

grant select on table public.profile to authenticated;

grant insert (
    id,
    full_name,
    selected_language,
    selected_language_level,
    motivations,
    interests,
    onboarding_completed,
    updated_at
) on table public.profile to authenticated;

grant update (
    id,
    full_name,
    selected_language,
    selected_language_level,
    motivations,
    interests,
    onboarding_completed,
    updated_at
) on table public.profile to authenticated;