/** Idempotent schema for 0mbre shop (run via direct Postgres connection). */
export const SCHEMA_SQL = `
create table if not exists public.catalogs (
  id text primary key,
  slug text not null unique,
  name text not null,
  image text not null default '',
  default_price integer not null default 0,
  default_product_name text not null default '',
  sort_order integer not null default 0
);

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  short_description text not null default '',
  description text not null default '',
  price integer not null default 0,
  catalog_id text not null references public.catalogs(id) on delete restrict,
  pieces integer not null default 0,
  sizes jsonb not null default '[]'::jsonb,
  in_stock boolean not null default true,
  featured boolean not null default false,
  images jsonb not null default '[]'::jsonb,
  details jsonb not null default '[]'::jsonb
);

create index if not exists products_catalog_id_idx on public.products (catalog_id);

create table if not exists public.shop_settings (
  id text primary key default 'default',
  default_price integer not null default 12000,
  default_name text not null default 'Handkerchief 2pcs',
  shop_open boolean not null default true,
  shipping_fee_ngn integer not null default 0,
  payment_timeout_minutes integer not null default 30
);

create table if not exists public.shop_customers (
  id text primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_id text not null references public.shop_customers(id) on delete restrict,
  customer_email text not null,
  status text not null check (status in ('pending', 'paid', 'delivered', 'expired')),
  delivery jsonb not null,
  items jsonb not null,
  subtotal integer not null,
  shipping_fee integer not null default 0,
  total integer not null,
  paystack_reference text,
  payment_url text,
  awaiting_payment_email_sent_at timestamptz,
  payment_reminder_email_sent_at timestamptz,
  expired_email_sent_at timestamptz,
  receipt_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  delivered_at timestamptz,
  expires_at timestamptz not null
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.otp_challenges (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null,
  attempts integer not null default 0
);
`;

/** Idempotent — adds sort_order and backfills rows that still share 0. */
export const CATALOG_SORT_ORDER_SQL = `
alter table public.catalogs add column if not exists sort_order integer not null default 0;

with ordered as (
  select id, row_number() over (order by name asc) - 1 as rn
  from public.catalogs
  where sort_order = 0
)
update public.catalogs as c
set sort_order = ordered.rn
from ordered
where c.id = ordered.id
  and (select count(*)::int from public.catalogs where sort_order = 0) > 1;
`;

/** Idempotent — adds email sent markers used to prevent duplicate order emails. */
export const ORDER_EMAIL_FIELDS_SQL = `
alter table public.orders
  add column if not exists payment_url text;

alter table public.orders
  add column if not exists awaiting_payment_email_sent_at timestamptz;

alter table public.orders
  add column if not exists payment_reminder_email_sent_at timestamptz;

alter table public.orders
  add column if not exists expired_email_sent_at timestamptz;

alter table public.orders
  add column if not exists receipt_email_sent_at timestamptz;
`;
