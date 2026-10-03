-- Keep undated manager_workspaces intact. Migration to a work date is explicit.
create table public.manager_days (
  owner_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null check (work_date between date '1900-01-01' and date '9999-12-31'),
  people jsonb not null default '[]'::jsonb,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, work_date),
  check (jsonb_typeof(people) = 'array'),
  check (pg_column_size(people) <= 1048576)
);

alter table public.manager_days enable row level security;
revoke all on public.manager_days from anon, authenticated;
grant select on public.manager_days to authenticated;

create policy "Managers read their own days"
  on public.manager_days for select to authenticated
  using (owner_id = (select auth.uid()));

-- JSONB numeric stores exact decimal amounts, normalized to cents. Each day
-- snapshots names, percentages, fixed amounts and sales independently.
create or replace function public.save_manager_day(
  selected_date date,
  expected_version bigint,
  next_people jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_version bigint;
  person jsonb;
  sale jsonb;
  ids text[] := array[]::text[];
  sale_ids text[];
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if selected_date is null or selected_date < date '1900-01-01'
     or selected_date > date '9999-12-31'
     or expected_version is null or expected_version < 0
     or jsonb_typeof(next_people) is distinct from 'array'
     or pg_column_size(next_people) > 1048576 then
    raise exception 'Invalid daily data';
  end if;
  for person in select value from jsonb_array_elements(next_people) loop
    if jsonb_typeof(person) is distinct from 'object'
       or jsonb_typeof(person->'id') is distinct from 'string'
       or length(person->>'id') = 0 or length(person->>'id') > 200
       or person->>'id' = any(ids)
       or jsonb_typeof(person->'name') is distinct from 'string'
       or length(person->>'name') > 1000
       or jsonb_typeof(person->'percentage') is distinct from 'number'
       or jsonb_typeof(person->'fixedAmount') is distinct from 'number'
       or jsonb_typeof(person->'sales') is distinct from 'array' then
      raise exception 'Invalid person';
    end if;
    if (person->>'percentage')::numeric not between 0 and 100
       or (person->>'fixedAmount')::numeric not between 0 and 1000000000
       or round((person->>'fixedAmount')::numeric, 2) <> (person->>'fixedAmount')::numeric then
      raise exception 'Invalid commission rule';
    end if;
    ids := array_append(ids, person->>'id');
    sale_ids := array[]::text[];
    for sale in select value from jsonb_array_elements(person->'sales') loop
      if jsonb_typeof(sale) is distinct from 'object'
         or jsonb_typeof(sale->'id') is distinct from 'string'
         or length(sale->>'id') = 0 or length(sale->>'id') > 200
         or sale->>'id' = any(sale_ids)
         or jsonb_typeof(sale->'amount') is distinct from 'number' then
        raise exception 'Invalid sale';
      end if;
      if (sale->>'amount')::numeric not between 0 and 1000000000
         or round((sale->>'amount')::numeric, 2) <> (sale->>'amount')::numeric then
        raise exception 'Invalid sale amount';
      end if;
      sale_ids := array_append(sale_ids, sale->>'id');
    end loop;
  end loop;

  if expected_version = 0 then
    insert into public.manager_days(owner_id, work_date, people)
      values ((select auth.uid()), selected_date, next_people)
      on conflict (owner_id, work_date) do nothing
      returning version into new_version;
  else
    update public.manager_days
      set people = next_people, version = version + 1, updated_at = now()
      where owner_id = (select auth.uid()) and work_date = selected_date
        and version = expected_version
      returning version into new_version;
  end if;
  if new_version is null then
    raise exception 'Este dia foi alterado em outra sessão. Copie suas alterações antes de recarregar.';
  end if;
  return new_version;
end;
$$;

revoke all on function public.save_manager_day(date, bigint, jsonb) from public, anon;
grant execute on function public.save_manager_day(date, bigint, jsonb) to authenticated;
