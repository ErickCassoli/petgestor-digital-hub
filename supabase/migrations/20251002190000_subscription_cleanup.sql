-- Align profile subscription data with free/pro plans only

alter table public.profiles
  alter column plan set default 'free';

update public.profiles
  set plan = coalesce(plan, 'free');

update public.profiles
  set plan_started_at = case
    when plan = 'pro' then coalesce(plan_started_at, now())
    else null
  end;

alter table public.profiles
  drop column if exists trial_end_date;

alter table public.profiles
  drop column if exists is_subscribed;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(new.raw_user_meta_data->>'name', new.email);
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'admin');
begin
  insert into public.profiles (id, name, role)
  values (new.id, v_name, v_role)
  on conflict (id) do update
    set name = excluded.name,
        role = excluded.role,
        updated_at = now();

  return new;
end;
$$;

create or replace function public.sync_profile_subscription()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.plan is null then
    new.plan := 'free';
  end if;

  if new.plan = 'pro' then
    if new.plan_started_at is null then
      new.plan_started_at := now();
    end if;
  else
    new.plan_started_at := null;
  end if;

  return new;
end;
$$;
