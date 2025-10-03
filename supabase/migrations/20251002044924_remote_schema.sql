create extension if not exists "pgjwt" with schema "extensions";


create table "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "pet_id" uuid not null,
    "service_id" uuid not null,
    "date" date not null,
    "time" time without time zone not null,
    "status" text default 'pending'::text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."appointments" enable row level security;

create table "public"."clients" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "email" text,
    "phone" text,
    "address" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."clients" enable row level security;

create table "public"."invoice_items" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" uuid not null,
    "service_id" uuid not null,
    "quantity" integer not null,
    "unit_price" numeric not null,
    "subtotal" numeric not null
);


alter table "public"."invoice_items" enable row level security;

create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "appointment_id" uuid not null,
    "user_id" uuid not null,
    "pet_id" uuid not null,
    "discount_amount" numeric not null default 0,
    "surcharge_amount" numeric not null default 0,
    "final_amount" numeric not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."invoices" enable row level security;

create table "public"."pets" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "user_id" uuid not null,
    "name" text not null,
    "type" text not null,
    "breed" text,
    "age" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."pets" enable row level security;

create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "description" text,
    "price" numeric(10,2) not null,
    "stock" double precision not null,
    "min_stock" integer default 5,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "type" numeric default '1'::numeric,
    "category" text default ''::text
);


alter table "public"."products" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "name" text,
    "role" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "plan" text not null default 'free'::text,
    "stripe_customer_id" text,
    "plan_started_at" timestamp with time zone
);


alter table "public"."profiles" enable row level security;

create table "public"."sale_items" (
    "id" uuid not null default gen_random_uuid(),
    "sale_id" uuid not null,
    "type" text not null,
    "product_id" uuid,
    "service_id" uuid,
    "name" text not null,
    "price" numeric not null,
    "quantity" double precision not null,
    "total" numeric not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "discount" numeric not null default 0,
    "surcharge" numeric not null default 0
);


alter table "public"."sale_items" enable row level security;

create table "public"."sales" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "client_id" uuid,
    "client_name" text,
    "sale_date" timestamp with time zone default now(),
    "subtotal" numeric not null,
    "surcharge" numeric not null default 0,
    "total" numeric not null,
    "type" text not null,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "discount" real
);


alter table "public"."sales" enable row level security;

create table "public"."services" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "description" text,
    "price" numeric(10,2) not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."services" enable row level security;

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (id);

CREATE INDEX idx_appointments_user_date ON public.appointments USING btree (user_id, date);

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);

CREATE INDEX idx_invoice_items_service_id ON public.invoice_items USING btree (service_id);

CREATE INDEX idx_invoices_appointment_id ON public.invoices USING btree (appointment_id);

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);

CREATE INDEX idx_pets_user ON public.pets USING btree (user_id);

CREATE INDEX idx_products_user ON public.products USING btree (user_id);

CREATE INDEX idx_services_user ON public.services USING btree (user_id);

CREATE UNIQUE INDEX invoice_items_pkey ON public.invoice_items USING btree (id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX pets_pkey ON public.pets USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX sale_items_pkey ON public.sale_items USING btree (id);

CREATE UNIQUE INDEX sales_pkey ON public.sales USING btree (id);

CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."clients" add constraint "clients_pkey" PRIMARY KEY using index "clients_pkey";

alter table "public"."invoice_items" add constraint "invoice_items_pkey" PRIMARY KEY using index "invoice_items_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."pets" add constraint "pets_pkey" PRIMARY KEY using index "pets_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."sale_items" add constraint "sale_items_pkey" PRIMARY KEY using index "sale_items_pkey";

alter table "public"."sales" add constraint "sales_pkey" PRIMARY KEY using index "sales_pkey";

alter table "public"."services" add constraint "services_pkey" PRIMARY KEY using index "services_pkey";

alter table "public"."appointments" add constraint "appointments_pet_id_fkey" FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_pet_id_fkey";

alter table "public"."appointments" add constraint "appointments_service_id_fkey" FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_service_id_fkey";

alter table "public"."appointments" add constraint "appointments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'canceled'::text, 'completed'::text]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."appointments" add constraint "appointments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_user_id_fkey";

alter table "public"."clients" add constraint "clients_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."clients" validate constraint "clients_user_id_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_invoice_id_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_quantity_check";

alter table "public"."invoice_items" add constraint "invoice_items_service_id_fkey" FOREIGN KEY (service_id) REFERENCES services(id) not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_service_id_fkey";

alter table "public"."invoices" add constraint "invoices_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_appointment_id_fkey";

alter table "public"."pets" add constraint "pets_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE not valid;

alter table "public"."pets" validate constraint "pets_client_id_fkey";

alter table "public"."pets" add constraint "pets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."pets" validate constraint "pets_user_id_fkey";

alter table "public"."products" add constraint "products_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."products" validate constraint "products_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_plan_check" CHECK ((plan = ANY (ARRAY['free'::text, 'pro'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_plan_check";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'atendente'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."sale_items" add constraint "sale_items_price_check" CHECK ((price >= (0)::numeric)) not valid;

alter table "public"."sale_items" validate constraint "sale_items_price_check";

alter table "public"."sale_items" add constraint "sale_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) not valid;

alter table "public"."sale_items" validate constraint "sale_items_product_id_fkey";

alter table "public"."sale_items" add constraint "sale_items_quantity_check" CHECK ((quantity > (0)::double precision)) not valid;

alter table "public"."sale_items" validate constraint "sale_items_quantity_check";

alter table "public"."sale_items" add constraint "sale_items_sale_id_fkey" FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE not valid;

alter table "public"."sale_items" validate constraint "sale_items_sale_id_fkey";

alter table "public"."sale_items" add constraint "sale_items_service_id_fkey" FOREIGN KEY (service_id) REFERENCES services(id) not valid;

alter table "public"."sale_items" validate constraint "sale_items_service_id_fkey";

alter table "public"."sale_items" add constraint "sale_items_total_check" CHECK ((total >= (0)::numeric)) not valid;

alter table "public"."sale_items" validate constraint "sale_items_total_check";

alter table "public"."sale_items" add constraint "sale_items_type_check" CHECK ((type = ANY (ARRAY['product'::text, 'service'::text]))) not valid;

alter table "public"."sale_items" validate constraint "sale_items_type_check";

alter table "public"."sale_items" add constraint "valid_item_type" CHECK ((((type = 'product'::text) AND (product_id IS NOT NULL) AND (service_id IS NULL)) OR ((type = 'service'::text) AND (service_id IS NOT NULL) AND (product_id IS NULL)))) not valid;

alter table "public"."sale_items" validate constraint "valid_item_type";

alter table "public"."sales" add constraint "sales_client_id_fkey" FOREIGN KEY (client_id) REFERENCES clients(id) not valid;

alter table "public"."sales" validate constraint "sales_client_id_fkey";

alter table "public"."sales" add constraint "sales_subtotal_check" CHECK ((subtotal >= (0)::numeric)) not valid;

alter table "public"."sales" validate constraint "sales_subtotal_check";

alter table "public"."sales" add constraint "sales_surcharge_check" CHECK ((surcharge >= (0)::numeric)) not valid;

alter table "public"."sales" validate constraint "sales_surcharge_check";

alter table "public"."sales" add constraint "sales_total_check" CHECK ((total >= (0)::numeric)) not valid;

alter table "public"."sales" validate constraint "sales_total_check";

alter table "public"."sales" add constraint "sales_type_check" CHECK ((type = ANY (ARRAY['product'::text, 'service'::text, 'mixed'::text]))) not valid;

alter table "public"."sales" validate constraint "sales_type_check";

alter table "public"."sales" add constraint "sales_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."sales" validate constraint "sales_user_id_fkey";

alter table "public"."services" add constraint "services_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."services" validate constraint "services_user_id_fkey";

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
  v_plan  text;
  v_limit int := (free_limits()->>'appointments_per_month')::int;
  v_count int;
  v_user  uuid := coalesce(new.user_id, old.user_id);
  v_date  date := coalesce(new.date, old.date);
  v_month_start date := date_trunc('month', v_date)::date;
  v_month_end   date := (date_trunc('month', v_date) + interval '1 month - 1 day')::date;
begin
  v_plan := public.get_user_plan(v_user);

  if v_plan = 'free' then
    select count(*) into v_count
    from public.appointments a
    where a.user_id = v_user
      and a.date between v_month_start and v_month_end
      and (tg_op <> 'UPDATE' or a.id <> new.id);

    if v_count >= v_limit then
      raise exception 'Limite do plano Free atingido: máximo % agendamentos no mês.', v_limit
        using hint   = 'Atualize para o Pro para criar mais agendamentos este mês.',
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
  v_plan  text;
  v_limit int := (free_limits()->>'pets')::int;
  v_count int;
  v_user  uuid := coalesce(new.user_id, old.user_id);
begin
  v_plan := public.get_user_plan(v_user);

  if v_plan = 'free' then
    select count(*) into v_count
    from public.pets
    where user_id = v_user
      and (tg_op <> 'UPDATE' or id <> new.id);

    if v_count >= v_limit then
      raise exception 'Limite do plano Free atingido: máximo % pets.', v_limit
        using hint   = 'Atualize para o Pro para cadastrar mais pets.',
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
  v_plan  text;
  v_limit int := (free_limits()->>'products')::int;
  v_count int;
  v_user  uuid := coalesce(new.user_id, old.user_id);
begin
  v_plan := public.get_user_plan(v_user);

  if v_plan = 'free' then
    select count(*) into v_count
    from public.products
    where user_id = v_user
      and (tg_op <> 'UPDATE' or id <> new.id);

    if v_count >= v_limit then
      raise exception 'Limite do plano Free atingido: máximo % produtos no estoque.', v_limit
        using hint   = 'Atualize para o Pro para cadastrar mais produtos.',
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
  v_plan  text;
  v_limit int := (free_limits()->>'services')::int;
  v_count int;
  v_user  uuid := coalesce(new.user_id, old.user_id);
begin
  v_plan := public.get_user_plan(v_user);

  if v_plan = 'free' then
    select count(*) into v_count
    from public.services
    where user_id = v_user
      and (tg_op <> 'UPDATE' or id <> new.id);

    if v_count >= v_limit then
      raise exception 'Limite do plano Free atingido: máximo % serviços.', v_limit
        using hint   = 'Atualize para o Pro para cadastrar mais serviços.',
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
  )
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user uuid)
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(plan, 'free') from public.profiles where id = p_user
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, role, trial_end_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'admin',
    (NOW() + INTERVAL '7 days')
  );
  RETURN NEW;
END;
$function$
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

create or replace view "public"."usage_summary" as  SELECT auth.uid() AS user_id,
    get_user_plan(auth.uid()) AS plan,
    ( SELECT count(*) AS count
           FROM pets p
          WHERE (p.user_id = auth.uid())) AS pets_count,
    ((free_limits() ->> 'pets'::text))::integer AS pets_limit,
    ( SELECT count(*) AS count
           FROM services s
          WHERE (s.user_id = auth.uid())) AS services_count,
    ((free_limits() ->> 'services'::text))::integer AS services_limit,
    ( SELECT count(*) AS count
           FROM products pr
          WHERE (pr.user_id = auth.uid())) AS products_count,
    ((free_limits() ->> 'products'::text))::integer AS products_limit,
    ( SELECT count(*) AS count
           FROM appointments a
          WHERE ((a.user_id = auth.uid()) AND (a.date >= (date_trunc('month'::text, now()))::date) AND (a.date < ((date_trunc('month'::text, now()) + '1 mon'::interval))::date))) AS appointments_this_month,
    ((free_limits() ->> 'appointments_per_month'::text))::integer AS appointments_limit;


create policy "Usuários podem atualizar seus próprios agendamentos"
on "public"."appointments"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Usuários podem criar seus próprios agendamentos"
on "public"."appointments"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Usuários podem excluir seus próprios agendamentos"
on "public"."appointments"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Usuários podem ver seus próprios agendamentos"
on "public"."appointments"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "appointments_rw"
on "public"."appointments"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Usuários podem atualizar seus próprios clientes"
on "public"."clients"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Usuários podem criar seus próprios clientes"
on "public"."clients"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Usuários podem excluir seus próprios clientes"
on "public"."clients"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Usuários podem ver seus próprios clientes"
on "public"."clients"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "invoice_items_insert_own"
on "public"."invoice_items"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.user_id = auth.uid())))));


create policy "invoice_items_select_own"
on "public"."invoice_items"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (i.user_id = auth.uid())))));


create policy "invoices_insert_own"
on "public"."invoices"
as permissive
for insert
to authenticated
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM appointments a
  WHERE ((a.id = invoices.appointment_id) AND (a.user_id = auth.uid())))) AND (EXISTS ( SELECT 1
   FROM pets p
  WHERE ((p.id = invoices.pet_id) AND (p.user_id = auth.uid()))))));


create policy "invoices_select_own"
on "public"."invoices"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "invoices_update_own"
on "public"."invoices"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Usuários podem atualizar seus próprios pets"
on "public"."pets"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Usuários podem criar seus próprios pets"
on "public"."pets"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Usuários podem excluir seus próprios pets"
on "public"."pets"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Usuários podem ver seus próprios pets"
on "public"."pets"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "pets_rw"
on "public"."pets"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Usuários podem atualizar seus próprios produtos"
on "public"."products"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Usuários podem criar seus próprios produtos"
on "public"."products"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Usuários podem excluir seus próprios produtos"
on "public"."products"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Usuários podem ver seus próprios produtos"
on "public"."products"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "products_rw"
on "public"."products"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Usuários podem atualizar seus próprios perfis"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Usuários podem ver seus próprios perfis"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Users can delete their own sale items"
on "public"."sale_items"
as permissive
for delete
to public
using ((sale_id IN ( SELECT sales.id
   FROM sales
  WHERE (sales.user_id = auth.uid()))));


create policy "Users can insert their own sale items"
on "public"."sale_items"
as permissive
for insert
to public
with check ((sale_id IN ( SELECT sales.id
   FROM sales
  WHERE (sales.user_id = auth.uid()))));


create policy "Users can update their own sale items"
on "public"."sale_items"
as permissive
for update
to public
using ((sale_id IN ( SELECT sales.id
   FROM sales
  WHERE (sales.user_id = auth.uid()))));


create policy "Users can view their own sale items"
on "public"."sale_items"
as permissive
for select
to public
using ((sale_id IN ( SELECT sales.id
   FROM sales
  WHERE (sales.user_id = auth.uid()))));


create policy "Users can delete their own sales"
on "public"."sales"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own sales"
on "public"."sales"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own sales"
on "public"."sales"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own sales"
on "public"."sales"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Usuários podem atualizar seus próprios serviços"
on "public"."services"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Usuários podem criar seus próprios serviços"
on "public"."services"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Usuários podem excluir seus próprios serviços"
on "public"."services"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Usuários podem ver seus próprios serviços"
on "public"."services"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "services_rw"
on "public"."services"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_items_updated_at BEFORE UPDATE ON public.sale_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


