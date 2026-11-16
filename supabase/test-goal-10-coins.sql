-- TEST ONLY: lets a gift card be claimed at 10 coins instead of 150,
-- and takes 10 coins per claim, so you can see the leftover coins.
-- Run in Supabase: SQL Editor > paste > Run.
--
-- To go back to 150: run supabase/rewards.sql again (it puts the normal version back).
-- Also change COIN_GOAL back to 150 in src/components/coin-balance.tsx.

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

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));

  balance := public.get_coin_balance();
  if balance < 10 then
    raise exception 'You need 10 coins to claim a gift card. You have %.', balance;
  end if;

  insert into public.reward_claims (user_id, coins) values (auth.uid(), 10);
  return balance - 10;
end;
$$;
