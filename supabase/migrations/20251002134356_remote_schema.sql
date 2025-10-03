create sequence "public"."limits_audit_id_seq";

create table "public"."limits_audit" (
    "id" integer not null default nextval('limits_audit_id_seq'::regclass),
    "user_id" uuid,
    "table_name" text,
    "resource" text,
    "limit_value" integer,
    "current_count" integer,
    "created_at" timestamp with time zone default now()
);


create table "public"."subscriptions" (
    "id" text not null,
    "user_id" uuid,
    "price_id" text,
    "status" text,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean,
    "amount" numeric,
    "currency" text,
    "interval" text,
    "interval_count" integer,
    "raw" jsonb,
    "updated_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now()
);


alter table "public"."appointments" add column "appointment_at" timestamp with time zone;

alter table "public"."pets" add column "deleted_at" timestamp with time zone;

alter table "public"."products" add column "deleted_at" timestamp with time zone;

alter table "public"."profiles" drop column "is_subscribed";

alter table "public"."profiles" drop column "trial_end_date";

alter table "public"."sales" add column "deleted_at" timestamp with time zone;

alter table "public"."services" add column "deleted_at" timestamp with time zone;

alter sequence "public"."limits_audit_id_seq" owned by "public"."limits_audit"."id";

CREATE INDEX idx_appointments_user_id_date ON public.appointments USING btree (user_id, date);

CREATE INDEX idx_clients_email ON public.clients USING btree (email);

CREATE INDEX idx_clients_phone ON public.clients USING btree (phone);

CREATE INDEX idx_clients_user_id ON public.clients USING btree (user_id);

CREATE INDEX idx_pets_user_id ON public.pets USING btree (user_id);

CREATE INDEX idx_products_user_id ON public.products USING btree (user_id);

CREATE INDEX idx_sale_items_sale_id ON public.sale_items USING btree (sale_id);

CREATE INDEX idx_sales_user_id_date ON public.sales USING btree (user_id, sale_date);

CREATE INDEX idx_services_user_id ON public.services USING btree (user_id);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);

CREATE UNIQUE INDEX limits_audit_pkey ON public.limits_audit USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

alter table "public"."limits_audit" add constraint "limits_audit_pkey" PRIMARY KEY using index "limits_audit_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_sale_totals()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Calculate subtotal from sale items
    NEW.subtotal := (
        SELECT COALESCE(SUM(price * quantity), 0)
        FROM sale_items
        WHERE sale_id = NEW.id
    );
    
    -- Ensure discount and surcharge are not null
    NEW.discount_amount := COALESCE(NEW.discount_amount, 0);
    NEW.surcharge_amount := COALESCE(NEW.surcharge_amount, 0);
    
    -- Calculate final total
    NEW.total := NEW.subtotal - NEW.discount_amount + NEW.surcharge_amount;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_free_appointments_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_free_pets_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_free_products_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.enforce_free_services_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.free_limits()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select jsonb_build_object(
    'pets', 10,
    'appointments_per_month', 15,
    'products', 20,
    'services', 5
  );
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user uuid)
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(plan, 'free')
  from public.profiles
  where id = p_user;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $
declare
  v_name text := coalesce(new.raw_user_meta_data->>'name', new.email);
  v_role text := coalesce(new.raw_user_meta_data->>'role', 'admin');
begin
  insert into public.profiles (
    id,
    name,
    role
  ) values (
    new.id,
    v_name,
    v_role
  )
  on conflict (id) do update
    set name = excluded.name,
        role = excluded.role,
        updated_at = now();

  return new;
end;
$
;

CREATE OR REPLACE FUNCTION public.sync_profile_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
AS $
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
$
;

CREATE OR REPLACE FUNCTION public.update_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;






