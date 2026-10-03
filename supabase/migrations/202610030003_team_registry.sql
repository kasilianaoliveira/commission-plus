-- One team registry per manager, independent of calendar days.
create table public.manager_teams (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  members jsonb not null default '[]'::jsonb,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(members) = 'array'),
  check (pg_column_size(members) <= 1048576)
);

alter table public.manager_teams enable row level security;
revoke all on public.manager_teams from anon, authenticated;
grant select on public.manager_teams to authenticated;
create policy "Managers read their own team"
  on public.manager_teams for select to authenticated
  using (owner_id = (select auth.uid()));

create or replace function public.save_manager_team(
  expected_version bigint,
  next_members jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_version bigint;
  member jsonb;
  ids text[] := array[]::text[];
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if expected_version is null or expected_version < 0
     or jsonb_typeof(next_members) is distinct from 'array'
     or pg_column_size(next_members) > 1048576 then
    raise exception 'Invalid team data';
  end if;
  for member in select value from jsonb_array_elements(next_members) loop
    if jsonb_typeof(member) is distinct from 'object'
       or jsonb_typeof(member->'id') is distinct from 'string'
       or length(member->>'id') = 0 or length(member->>'id') > 200
       or member->>'id' = any(ids)
       or jsonb_typeof(member->'name') is distinct from 'string'
       or length(btrim(member->>'name')) = 0 or length(member->>'name') > 1000
       or jsonb_typeof(member->'percentage') is distinct from 'number'
       or jsonb_typeof(member->'fixedAmount') is distinct from 'number'
       or member ? 'sales' then
      raise exception 'Invalid team member';
    end if;
    if (member->>'percentage')::numeric not between 0 and 100
       or (member->>'fixedAmount')::numeric not between 0 and 1000000000
       or round((member->>'fixedAmount')::numeric, 2) <> (member->>'fixedAmount')::numeric then
      raise exception 'Invalid commission rule';
    end if;
    ids := array_append(ids, member->>'id');
  end loop;

  if expected_version = 0 then
    insert into public.manager_teams(owner_id, members)
      values ((select auth.uid()), next_members)
      on conflict (owner_id) do nothing
      returning version into new_version;
  else
    update public.manager_teams
      set members = next_members, version = version + 1, updated_at = now()
      where owner_id = (select auth.uid()) and version = expected_version
      returning version into new_version;
  end if;
  if new_version is null then
    raise exception 'A equipe foi alterada em outra sessão. Copie suas alterações antes de recarregar.';
  end if;
  return new_version;
end;
$$;

revoke all on function public.save_manager_team(bigint, jsonb) from public, anon;
grant execute on function public.save_manager_team(bigint, jsonb) to authenticated;
