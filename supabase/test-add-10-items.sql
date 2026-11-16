-- TEST ONLY: gives a user the coins for 10 items (10 x 3 = 30 coins)
-- without uploading any photos. Run in Supabase: SQL Editor > paste > Run.
--
-- How it works: it adds a "claim" of -30 coins. Claims normally take coins away,
-- so a negative claim adds them. My Items is not changed (no fake photos).
--
-- 1. Put the email you sign in to the app with here (it appears 3 times below).

-- Add 30 coins
insert into public.reward_claims (user_id, coins)
select id, -30
from auth.users
where email = 'YOUR_APP_EMAIL@example.com';

-- Check: shows your test bonus rows and your total claims
select email, c.coins, c.created_at
from public.reward_claims c
join auth.users u on u.id = c.user_id
where u.email = 'YOUR_APP_EMAIL@example.com'
order by c.created_at;


-- 2. When you're done testing, remove the test coins.
--    Select only the line below and click Run (or run it in a new query):
-- delete from public.reward_claims where coins < 0 and user_id = (select id from auth.users where email = 'YOUR_APP_EMAIL@example.com');
