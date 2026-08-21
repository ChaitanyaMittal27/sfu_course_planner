set local check_function_bodies = off;

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "service_role";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "service_role";

create extension "hypopg" schema "extensions";

create extension "index_advisor" schema "extensions";

create sequence "public"."course_digger_map_course_digger_map_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."course_digger_stats_course_digger_stats_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."course_stats_stats_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."courses_course_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."departments_dept_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."terms_term_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create sequence "public"."watchers_watcher_id_seq" as integer increment by 1 minvalue 1 maxvalue 2147483647 START with 1 cache 1 no cycle;

create table "public"."bookmarks" (
  "bookmark_id"   integer                     not null default nextval('public.watchers_watcher_id_seq'::regclass),
  "dept_id"       integer                     not null,
  "user_id"       uuid                        not null,
  "course_id"     integer                     not null,
  "semester_code" integer                     not null,
  "section"       character varying(50)       not null,
  "created_at"    timestamp without time zone default current_timestamp,
  constraint "watchers_pkey" primary key (bookmark_id),
  constraint "watchers_user_id_dept_id_course_id_semester_code_section_key" unique (user_id, dept_id, course_id, semester_code, section)
);

alter table "public"."bookmarks"
  enable row level security;

create table "public"."contact_submissions" (
  "id"            uuid                     not null default gen_random_uuid(),
  "name"          character varying(255)   not null,
  "email"         character varying(255)   not null,
  "reason"        character varying(100),
  "message"       text                     not null,
  "is_read"       boolean                  default false,
  "is_archived"   boolean                  default false,
  "is_replied"    boolean                  default false,
  "reply_message" text,
  "reply_sent_to" character varying(255),
  "replied_at"    timestamp with time zone,
  "submitted_at"  timestamp with time zone default now(),
  constraint "contact_submissions_pkey" primary key (id)
);

alter table "public"."contact_submissions"
  enable row level security;

create table "public"."course_digger_map" (
  "course_digger_map_id" integer                     not null default nextval('public.course_digger_map_course_digger_map_id_seq'::regclass),
  "course_id"            integer                     not null,
  "digger_course_id"     integer                     not null,
  "source_school_id"     integer                     not null default 1,
  "discovered_at"        timestamp without time zone default current_timestamp,
  "last_verified_at"     timestamp without time zone,
  constraint "course_digger_map_course_id_key" unique (course_id),
  constraint "course_digger_map_digger_course_id_key" unique (digger_course_id),
  constraint "course_digger_map_pkey" primary key (course_digger_map_id)
);

alter table "public"."course_digger_map"
  enable row level security;

create table "public"."course_digger_stats" (
  "course_digger_stats_id" integer                     not null default nextval('public.course_digger_stats_course_digger_stats_id_seq'::regclass),
  "course_digger_map_id"   integer                     not null,
  "median_grade"           character varying(10),
  "fail_rate"              double precision,
  "grade_distribution"     jsonb,
  "last_fetched_at"        timestamp without time zone default current_timestamp,
  constraint "course_digger_stats_course_digger_map_id_key" unique (course_digger_map_id),
  constraint "course_digger_stats_pkey" primary key (course_digger_stats_id)
);

alter table "public"."course_digger_stats"
  enable row level security;

create table "public"."course_stats" (
  "stats_id"           integer                     not null default nextval('public.course_stats_stats_id_seq'::regclass),
  "course_id"          integer                     not null,
  "total_enrollment"   integer                     default 0,
  "total_capacity"     integer                     default 0,
  "load_percent"       double precision,
  "offered_terms"      jsonb,
  "last_calculated_at" timestamp without time zone default current_timestamp,
  constraint "course_stats_course_id_key" unique (course_id),
  constraint "course_stats_pkey" primary key (stats_id)
);

alter table "public"."course_stats"
  enable row level security;

create table "public"."courses" (
  "course_id"     integer                     not null default nextval('public.courses_course_id_seq'::regclass),
  "dept_id"       integer                     not null,
  "course_number" character varying(10)       not null,
  "title"         character varying(500),
  "description"   text,
  "units"         integer,
  "degree_level"  character varying(20),
  "prerequisites" text,
  "corequisites"  text,
  "designation"   character varying(100),
  "created_at"    timestamp without time zone default current_timestamp,
  "updated_at"    timestamp without time zone default current_timestamp,
  constraint "courses_dept_id_course_number_key" unique (dept_id, course_number),
  constraint "courses_pkey" primary key (course_id)
);

alter table "public"."courses"
  enable row level security;

create table "public"."departments" (
  "dept_id"    integer                     not null default nextval('public.departments_dept_id_seq'::regclass),
  "dept_code"  character varying(10)       not null,
  "name"       character varying(255)      not null,
  "created_at" timestamp without time zone default current_timestamp,
  constraint "departments_dept_code_key" unique (dept_code),
  constraint "departments_pkey" primary key (dept_id)
);

alter table "public"."departments"
  enable row level security;

create table "public"."terms" (
  "term_id"      integer                     not null default nextval('public.terms_term_id_seq'::regclass),
  "year"         integer                     not null,
  "term"         character varying(10)       not null,
  "is_current"   boolean                     default false,
  "is_enrolling" boolean                     default false,
  "updated_at"   timestamp without time zone default current_timestamp,
  constraint "terms_pkey" primary key (term_id)
);

alter table "public"."terms"
  enable row level security;

create table "public"."user_preferences" (
  "user_id"                     uuid                        not null,
  "email_notifications_enabled" boolean                     default false,
  "created_at"                  timestamp without time zone default current_timestamp,
  "updated_at"                  timestamp without time zone default current_timestamp,
  "user_email"                  character varying,
  "last_notified_at"            timestamp without time zone,
  constraint "user_preferences_pkey" primary key (user_id)
);

alter table "public"."user_preferences"
  enable row level security;

alter sequence "public"."watchers_watcher_id_seq" owned by "public"."bookmarks"."bookmark_id";

alter sequence "public"."course_digger_map_course_digger_map_id_seq" owned by "public"."course_digger_map"."course_digger_map_id";

alter sequence "public"."course_digger_stats_course_digger_stats_id_seq" owned by "public"."course_digger_stats"."course_digger_stats_id";

alter sequence "public"."course_stats_stats_id_seq" owned by "public"."course_stats"."stats_id";

alter sequence "public"."courses_course_id_seq" owned by "public"."courses"."course_id";

alter sequence "public"."departments_dept_id_seq" owned by "public"."departments"."dept_id";

alter sequence "public"."terms_term_id_seq" owned by "public"."terms"."term_id";

create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  AS $function$
BEGIN
  INSERT INTO public.user_preferences (user_id, user_email, email_notifications_enabled)
  VALUES (NEW.id, NEW.email, true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

alter table "public"."course_digger_stats"
  add constraint "course_digger_stats_course_digger_map_id_fkey" foreign key (course_digger_map_id) references public.course_digger_map(course_digger_map_id) on delete cascade;

alter table "public"."bookmarks"
  add constraint "watchers_course_id_fkey" foreign key (course_id) references public.courses(course_id) on delete cascade;

alter table "public"."course_digger_map"
  add constraint "course_digger_map_course_id_fkey" foreign key (course_id) references public.courses(course_id) on delete cascade;

alter table "public"."course_stats"
  add constraint "course_stats_course_id_fkey" foreign key (course_id) references public.courses(course_id) on delete cascade;

alter table "public"."bookmarks"
  add constraint "watchers_dept_id_fkey" foreign key (dept_id) references public.departments(dept_id) on delete cascade;

alter table "public"."courses"
  add constraint "courses_dept_id_fkey" foreign key (dept_id) references public.departments(dept_id) on delete cascade;

create index idx_course_digger_map on public.course_digger_map using btree (course_id);

create index idx_course_digger_stats on public.course_digger_stats using btree (course_digger_stats_id);

create index idx_courses_dept_number on public.courses using btree (dept_id, course_number);

create index idx_courses_dept on public.courses using btree (dept_id);

create index idx_courses_number on public.courses using btree (course_number);

create index idx_departments_code on public.departments using btree (dept_code);

create index idx_stats_course on public.course_stats using btree (course_id);

create index idx_stats_offered_terms on public.course_stats using gin (offered_terms);

create index idx_terms_current on public.terms using btree (is_current)
  where (is_current = true);

create index idx_terms_enrolling on public.terms using btree (is_enrolling)
  where (is_enrolling = true);

create index idx_user_preference_email_user_lookup on public.user_preferences using btree (user_id, email_notifications_enabled);

create index idx_user_preferences_user_lookup on public.user_preferences using btree (user_id);

create index idx_watchers_offering on public.bookmarks using btree (dept_id, course_id, semester_code, section);

create index idx_watchers_user_lookup on public.bookmarks using btree (user_id);

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create policy "Users can delete own bookmarks" on "public"."bookmarks"
  for delete
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Users can insert own bookmarks" on "public"."bookmarks"
  for insert
  to PUBLIC
  with check ((auth.uid() = user_id));

create policy "Users can view own bookmarks" on "public"."bookmarks"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Public read course_digger_map" on "public"."course_digger_map"
  for select
  to PUBLIC
  using (true);

create policy "Public read course_digger_stats" on "public"."course_digger_stats"
  for select
  to PUBLIC
  using (true);

create policy "Public read course_stats" on "public"."course_stats"
  for select
  to PUBLIC
  using (true);

create policy "Enable read access for all users" on "public"."courses"
  for select
  to PUBLIC
  using (true);

create policy "Public read courses" on "public"."courses"
  for select
  to PUBLIC
  using (true);

create policy "Enable read access for all users" on "public"."departments"
  for select
  to PUBLIC
  using (true);

create policy "Public read departments" on "public"."departments"
  for select
  to PUBLIC
  using (true);

create policy "Public read terms" on "public"."terms"
  for select
  to PUBLIC
  using (true);

create policy "Users can insert own preferences" on "public"."user_preferences"
  for insert
  to PUBLIC
  with check ((auth.uid() = user_id));

create policy "Users can update own preferences" on "public"."user_preferences"
  for update
  to PUBLIC
  using ((auth.uid() = user_id));

create policy "Users can view own preferences" on "public"."user_preferences"
  for select
  to PUBLIC
  using ((auth.uid() = user_id));

comment on extension "hypopg" is 'Hypothetical indexes for PostgreSQL';

comment on extension "index_advisor" is 'Query index advisor';

grant execute on function "public"."handle_new_user"() to public, "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."course_digger_map_course_digger_map_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."course_digger_stats_course_digger_stats_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."course_stats_stats_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."courses_course_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."departments_dept_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."terms_term_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant select, update, usage on sequence "public"."watchers_watcher_id_seq" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."bookmarks" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."contact_submissions" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."course_digger_map" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."course_digger_stats" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."course_stats" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."courses" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."departments" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."terms" to "anon", "authenticated", "postgres", "service_role";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."user_preferences" to "anon", "authenticated", "postgres", "service_role";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "anon";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "authenticated";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "service_role";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "anon";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "authenticated";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "service_role";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "anon";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "authenticated";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "service_role";

