begin;

create table public.lp_stripe_sandbox_accounts (
  user_id uuid primary key references auth.users(id),
  stripe_account_id text not null unique
);

alter table public.lp_stripe_sandbox_accounts enable row level security;
revoke all on public.lp_stripe_sandbox_accounts from anon, authenticated;
grant all on public.lp_stripe_sandbox_accounts to service_role;

commit;
