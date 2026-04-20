alter table public.profile
    alter column selected_language type text using selected_language::text;

drop type public.supported_language;