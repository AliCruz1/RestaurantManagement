-- Staff Role Coverage Targets Table
-- Creates a simple table to persist weekly target counts per role.
-- Run in Supabase SQL editor.

create table if not exists public.staff_role_targets (
  role text primary key,
  target integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.staff_role_targets enable row level security;

-- Policies (CREATE POLICY ... IF NOT EXISTS not supported in your PG version; use DO block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staff_role_targets' AND policyname='staff_role_targets_select'
  ) THEN
    CREATE POLICY staff_role_targets_select ON public.staff_role_targets
      FOR SELECT
      USING (auth.uid() IS NOT NULL); -- any authenticated user can read
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staff_role_targets' AND policyname='staff_role_targets_insert'
  ) THEN
    CREATE POLICY staff_role_targets_insert ON public.staff_role_targets
      FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staff_role_targets' AND policyname='staff_role_targets_update'
  ) THEN
    CREATE POLICY staff_role_targets_update ON public.staff_role_targets
      FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')
      ));
  END IF;
END $$;

comment on table public.staff_role_targets is 'Stores desired weekly shift coverage target counts per staff role.';

select '✅ staff_role_targets ready' as status, count(*) as roles_defined from public.staff_role_targets;
