-- Manual operational snippet. Run only in the SQL Editor for the intended Supabase project.
-- verifies that the user with email 'admin@test.com' has the role 'admin'.
select
  email,
  raw_app_meta_data ->> 'role' as role
from auth.users
where email = 'admin@test.com';
