-- Manual operational snippet. Run only in the SQL Editor for the intended Supabase project.
-- This is not a migration or local seed; change the email deliberately before running it.
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@test.com';
