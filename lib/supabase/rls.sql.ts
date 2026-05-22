/**
 * Row Level Security — block direct PostgREST access with the anon key.
 * The Next.js app uses SUPABASE_SERVICE_ROLE_KEY on the server only and enforces
 * customer scope in application code (signed shop session cookie).
 */
export const RLS_SQL = `
alter table public.orders enable row level security;
alter table public.shop_customers enable row level security;
alter table public.otp_challenges enable row level security;
alter table public.products enable row level security;
alter table public.catalogs enable row level security;
alter table public.shop_settings enable row level security;
`;
