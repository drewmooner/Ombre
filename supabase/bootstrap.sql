-- Run once in Supabase Dashboard → SQL Editor if automatic setup fails.
-- https://supabase.com/dashboard/project/jcfeslosddylavlaumjw/sql/new

create table if not exists public.catalogs (
  id text primary key,
  slug text not null unique,
  name text not null,
  image text not null default '',
  default_price integer not null default 0,
  default_product_name text not null default ''
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
  payment_timeout_minutes integer not null default 45
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
