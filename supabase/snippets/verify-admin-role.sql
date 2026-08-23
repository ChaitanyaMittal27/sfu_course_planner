-- Manual operational snippet. Run only in the SQL Editor for the intended Supabase project.
-- This is not a migration or local seed; change the email deliberately before running it.
select
  email,
  raw_app_meta_data ->> 'role' as role
from auth.users
where email = 'admin@test.com';
