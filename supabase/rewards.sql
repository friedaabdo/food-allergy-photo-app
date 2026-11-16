-- Rewards: keeps track of gift card claims so coins go down when you claim.
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
--
-- Coin balance = (items photographed x 3) - (coins already claimed)
-- If you change the 3 or the 150 here, change COINS_PER_SET / COIN_GOAL
-- in src/components/coin-balance.tsx to match.

-- 1. A table with one row for every gift card claimed
create table if not exists public.reward_claims (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coins int not null,
  created_at timestamptz not null default now()
);

alter table public.reward_claims enable row level security;

-- People can see their own claims. There is no insert policy on purpose:
-- the only way to add a claim is claim_reward() below, which checks the balance.
drop policy if exists "Users can see their own claims" on public.reward_claims;
create policy "Users can see their own claims"
  on public.reward_claims for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- 2. Works out the signed-in user's coin balance
-- Photos are stored as photos/<user-id>/<timestamp>/front.jpg; each <timestamp> folder is one item.
create or replace function public.get_coin_balance()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select (
    (
      select count(distinct split_part(o.name, '/', 2))
      from storage.objects o
      where o.bucket_id = 'photos'
        and split_part(o.name, '/', 1) = auth.uid()::text
        and split_part(o.name, '/', 3) <> ''
        and left(split_part(o.name, '/', 3), 1) <> '.'
    ) * 3
    - coalesce((select sum(c.coins) from public.reward_claims c where c.user_id = auth.uid()), 0)
  )::int;
$$;

-- 3. Claims a gift card: checks there are at least 150 coins, then takes them away
create or replace function public.claim_reward()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  balance int;
begin
  if auth.uid() is null then
    raise exception 'Sign in to claim a reward.';
  end if;

  -- Stops a fast double tap from claiming twice
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));

  balance := public.get_coin_balance();
  if balance < 150 then
    raise exception 'You need 150 coins to claim a gift card. You have %.', balance;
  end if;

  insert into public.reward_claims (user_id, coins) values (auth.uid(), 150);
  return balance - 150; -- the new balance
end;
$$;

-- Only signed-in users can call these
revoke execute on function public.get_coin_balance() from public, anon;
revoke execute on function public.claim_reward() from public, anon;
grant execute on function public.get_coin_balance() to authenticated;
grant execute on function public.claim_reward() to authenticated;
