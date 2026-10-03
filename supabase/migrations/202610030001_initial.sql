-- One private workspace per manager. The JSON snapshot preserves the current calculator
-- until dated sales and historic commission rules are introduced in a later migration.
create table public.manager_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  people jsonb not null default '[]'::jsonb,
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default now(),
  constraint people_is_array check (jsonb_typeof(people) = 'array'),
  constraint people_size_limit check (pg_column_size(people) <= 1048576)
);

alter table public.manager_workspaces enable row level security;
revoke all on public.manager_workspaces from anon, authenticated;
grant select, insert on public.manager_workspaces to authenticated;

create policy "Managers read their own workspace"
  on public.manager_workspaces for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Managers create their own workspace"
  on public.manager_workspaces for insert to authenticated
  with check (owner_id = (select auth.uid()) and version = 0 and people = '[]'::jsonb);

-- A compare-and-swap write prevents one stale browser tab from overwriting another.
create or replace function public.save_manager_workspace(
  expected_version bigint,
  next_people jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare new_version bigint;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(next_people) is distinct from 'array'
     or pg_column_size(next_people) > 1048576 then
    raise exception 'Invalid workspace data';
  end if;

  update public.manager_workspaces
  set people = next_people,
      version = version + 1,
      updated_at = now()
  where owner_id = (select auth.uid()) and version = expected_version
  returning version into new_version;

  if new_version is null then
    raise exception 'Workspace changed in another session. Reload before saving.';
  end if;
  return new_version;
end;
$$;

revoke all on function public.save_manager_workspace(bigint, jsonb) from public, anon;
grant execute on function public.save_manager_workspace(bigint, jsonb) to authenticated;
