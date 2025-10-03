-- Ensure profile subscription columns and defaults
alter table public.profiles
  add column if not exists plan text;

update public.profiles
  set plan = coalesce(plan, 'free');

alter table public.profiles
  alter column plan set default 'free';

alter table public.profiles
  alter column plan set not null;

alter table public.profiles
  add column if not exists plan_started_at timestamptz;

alter table public.profiles
  add column if not exists stripe_customer_id text;

update public.profiles
  set plan_started_at = case
    when plan = 'pro' then coalesce(plan_started_at, now())
    else null
  end;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_plan_check
      check (plan in ('free', 'pro'));
  end if;
end
$$;

-- Keep subscription metadata in sync
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

drop trigger if exists sync_profile_subscription on public.profiles;
create trigger sync_profile_subscription
before insert or update on public.profiles
for each row execute function public.sync_profile_subscription();

-- Handle new user onboarding with free plan defaults
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(new.raw_user_meta_data->>'name', new.email);
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'admin');
  has_plan boolean;
  has_plan_started_at boolean;
begin
  insert into public.profiles (id, name, role)
  values (new.id, v_name, v_role)
  on conflict (id) do update
    set name = excluded.name,
        role = excluded.role,
        updated_at = now();

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'plan'
  ) into has_plan;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'plan_started_at'
  ) into has_plan_started_at;

  if has_plan then
    update public.profiles
      set plan = 'free',
          updated_at = now()
    where id = new.id;
  end if;

  if has_plan_started_at then
    update public.profiles
      set plan_started_at = null,
          updated_at = now()
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Free plan limits configuration
create or replace function public.free_limits()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'pets', 10,
    'appointments_per_month', 15,
    'products', 20,
    'services', 5
  );
$$;

create or replace function public.get_user_plan(p_user uuid)
returns text
language sql
stable
as $$
  select coalesce(plan, 'free')
  from public.profiles
  where id = p_user;
$$;

create or replace function public.enforce_free_pets_limit()
returns trigger
language plpgsql
as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_plan text := public.get_user_plan(v_user);
  v_limit int := (public.free_limits()->>'pets')::int;
  v_count int;
begin
  if v_plan = 'free' then
    select count(*) into v_count
    from public.pets
    where user_id = v_user
      and (tg_op <> 'UPDATE' or id <> coalesce(new.id, old.id));

    if v_count >= v_limit then
      raise exception 'Limite do plano Free atingido: maximo % pets cadastrados.', v_limit
        using hint = 'Atualize para o plano Pro para gerenciar mais pets.',
              errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_free_services_limit()
returns trigger
language plpgsql
as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_plan text := public.get_user_plan(v_user);
  v_limit int := (public.free_limits()->>'services')::int;
  v_count int;
begin
  if v_plan = 'free' then
    select count(*) into v_count
    from public.services
    where user_id = v_user
      and (tg_op <> 'UPDATE' or id <> coalesce(new.id, old.id));

    if v_count >= v_limit then
      raise exception 'Limite do plano Free atingido: maximo % servicos cadastrados.', v_limit
        using hint = 'Atualize para o plano Pro para oferecer mais servicos.',
              errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_free_products_limit()
returns trigger
language plpgsql
as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_plan text := public.get_user_plan(v_user);
  v_limit int := (public.free_limits()->>'products')::int;
  v_count int;
begin
  if v_plan = 'free' then
    select count(*) into v_count
    from public.products
    where user_id = v_user
      and (tg_op <> 'UPDATE' or id <> coalesce(new.id, old.id));

    if v_count >= v_limit then
      raise exception 'Limite do plano Free atingido: maximo % itens cadastrados no estoque.', v_limit
        using hint = 'Atualize para o plano Pro para gerir mais itens.',
              errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_free_appointments_limit()
returns trigger
language plpgsql
as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_plan text := public.get_user_plan(v_user);
  v_limit int := (public.free_limits()->>'appointments_per_month')::int;
  v_count int;
  v_date date := coalesce(new.date, old.date);
  v_month_start date;
  v_month_end date;
begin
  if v_plan = 'free' and v_date is not null then
    v_month_start := date_trunc('month', v_date)::date;
    v_month_end := (date_trunc('month', v_date) + interval '1 month - 1 day')::date;

    select count(*) into v_count
    from public.appointments a
    where a.user_id = v_user
      and a.date between v_month_start and v_month_end
      and (tg_op <> 'UPDATE' or a.id <> coalesce(new.id, old.id));

    if v_count >= v_limit then
      raise exception 'Limite do plano Free atingido: maximo % agendamentos neste mes.', v_limit
        using hint = 'Atualize para o plano Pro para criar agendamentos ilimitados.',
              errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

-- Attach limit triggers
set check_function_bodies = off;

drop trigger if exists enforce_free_pets_limit on public.pets;
create trigger enforce_free_pets_limit
before insert or update on public.pets
for each row execute function public.enforce_free_pets_limit();

drop trigger if exists enforce_free_services_limit on public.services;
create trigger enforce_free_services_limit
before insert or update on public.services
for each row execute function public.enforce_free_services_limit();

drop trigger if exists enforce_free_products_limit on public.products;
create trigger enforce_free_products_limit
before insert or update on public.products
for each row execute function public.enforce_free_products_limit();

drop trigger if exists enforce_free_appointments_limit on public.appointments;
create trigger enforce_free_appointments_limit
before insert or update on public.appointments
for each row execute function public.enforce_free_appointments_limit();
