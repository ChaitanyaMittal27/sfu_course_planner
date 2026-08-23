-- Manual operational snippet. Run only in the SQL Editor for the intended Supabase project.
-- for dev admin user: admin@test.com (pass: admin)
-- sets the role of a user to admin in the auth.users table by updating their raw_app_meta_data field.
-- need to check if the user exists first, and if not, create it. 
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@test.com';
