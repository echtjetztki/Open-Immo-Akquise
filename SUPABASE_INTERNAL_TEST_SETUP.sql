-- ==========================================
-- OPEN-AKQUISE INTERNAL TEST SETUP
-- ==========================================
-- Purpose:
--   Complete, reproducible setup for an internal test instance.
--   Creates all required tables, RLS policies, demo seed data,
--   and a DB cron reset every 30 minutes.
--
-- Usage:
--   1) Open Supabase SQL Editor
--   2) Run this file once
-- ==========================================

begin;

create extension if not exists pg_cron with schema extensions;

-- ------------------------------------------
-- Core tables
-- ------------------------------------------
create table if not exists public."property-leads" (
  id bigserial primary key,
  link text not null,
  title text,
  external_id text unique,
  uebergeben_am date not null,
  tagesdatum date not null default current_date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status text not null default 'Zu vergeben',
  kaufpreis numeric(12,2) not null default 0,
  gesamtprovision numeric(12,2) generated always as (kaufpreis * 0.06) stored,
  provision_abgeber numeric(12,2) generated always as (kaufpreis * 0.03) stored,
  provision_kaeufer numeric(12,2) generated always as (kaufpreis * 0.03) stored,
  berechnung numeric(12,2) generated always as ((kaufpreis * 0.06) * 0.10) stored,
  email text,
  telefonnummer text,
  objekttyp text default 'Kauf',
  plz text,
  ort text,
  betreut_von text,
  provision_abgeber_custom numeric(12,2),
  provision_kaeufer_custom numeric(12,2),
  notizfeld text,
  status_changed_at timestamp with time zone default now(),
  constraint property_leads_status_check check (
    status in (
      'NEU',
      'Zu vergeben',
      'Von GP kontaktiert',
      'Aufgenommen',
      'Vermarktung',
      'Abschluss/Verkauf',
      'Follow-up',
      'Storniert'
    )
  )
);

create table if not exists public.users (
  id serial primary key,
  username varchar(255) not null unique,
  password_hash text not null,
  role varchar(20) not null default 'user',
  display_name varchar(255),
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

create table if not exists public.property_notes (
  id serial primary key,
  property_id bigint references public."property-leads"(id) on delete cascade,
  content text not null default '',
  note_text text not null default '',
  created_by text default 'system',
  created_at timestamp with time zone default now()
);

create table if not exists public.external_source_replies (
  id serial primary key,
  external_source_code text not null,
  reply_message text,
  created_at timestamp with time zone default now()
);

create table if not exists public."property-replies" (
  id bigserial primary key,
  external_source_code text,
  reply_message text,
  created_at timestamp with time zone default now()
);

create table if not exists public.property_reporting (
  id bigserial primary key,
  external_id text not null,
  status text not null,
  note text,
  ip_address text,
  created_at timestamp with time zone default now()
);

-- ------------------------------------------
-- CRM tables
-- ------------------------------------------
create table if not exists public.crm_customers (
  id serial primary key,
  name varchar(255) not null,
  email varchar(255),
  phone varchar(255),
  company varchar(255),
  address text,
  created_at timestamp with time zone default current_timestamp
);

create table if not exists public.crm_articles (
  id serial primary key,
  title varchar(255) not null,
  description text,
  price numeric(15,2) not null,
  unit varchar(50) default 'Stueck',
  created_at timestamp with time zone default current_timestamp
);

create table if not exists public.crm_invoices (
  id serial primary key,
  invoice_number varchar(100) not null unique,
  customer_id integer references public.crm_customers(id) on delete set null,
  customer_name varchar(255),
  customer_email varchar(255),
  customer_address text,
  total_amount numeric(15,2) not null default 0,
  status varchar(50) default 'Entwurf',
  issue_date date default current_date,
  due_date date,
  created_at timestamp with time zone default current_timestamp
);

create table if not exists public.crm_invoice_items (
  id serial primary key,
  invoice_id integer references public.crm_invoices(id) on delete cascade,
  article_id integer references public.crm_articles(id) on delete set null,
  title varchar(255) not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(15,2) not null,
  total_price numeric(15,2) not null,
  created_at timestamp with time zone default current_timestamp
);

-- ------------------------------------------
-- AI chat table
-- ------------------------------------------
create table if not exists public.agent_chats (
  id bigserial primary key,
  question text not null,
  answer text not null,
  created_at timestamp with time zone not null default now()
);

-- ------------------------------------------
-- License tables
-- ------------------------------------------
create table if not exists public.license_keys (
  id bigserial primary key,
  code_hash text not null unique,
  label text,
  is_active boolean not null default true,
  max_installations integer,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.license_installations (
  id bigserial primary key,
  license_key_id bigint not null references public.license_keys(id) on delete cascade,
  install_host text not null,
  install_origin text not null,
  install_path text not null default '/',
  is_active boolean not null default true,
  first_verified_at timestamp with time zone not null default now(),
  last_verified_at timestamp with time zone not null default now(),
  unique (license_key_id, install_host, install_path)
);

-- ------------------------------------------
-- n8n activation tables
-- ------------------------------------------
create table if not exists public.n8n_activation_keys (
  id bigserial primary key,
  code_hash text not null unique,
  label text,
  is_active boolean not null default true,
  max_installations integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.n8n_activation_installations (
  id bigserial primary key,
  activation_key_id bigint not null references public.n8n_activation_keys(id) on delete cascade,
  install_host text not null,
  install_origin text not null,
  install_path text not null default '/',
  is_active boolean not null default true,
  first_verified_at timestamp with time zone not null default now(),
  last_verified_at timestamp with time zone not null default now(),
  unique (activation_key_id, install_host, install_path)
);

-- ------------------------------------------
-- Helpful indexes
-- ------------------------------------------
create index if not exists idx_leads_status on public."property-leads"(status);
create index if not exists idx_leads_external_id on public."property-leads"(external_id);
create index if not exists idx_leads_betreut_von on public."property-leads"(betreut_von);
create index if not exists idx_property_notes_property_id on public.property_notes(property_id);
create index if not exists idx_external_source_replies_code on public.external_source_replies(external_source_code);
create index if not exists idx_property_replies_code on public."property-replies"(external_source_code);
create index if not exists idx_property_reporting_external_id on public.property_reporting(external_id);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_crm_invoice_items_article_id on public.crm_invoice_items(article_id);
create index if not exists idx_crm_invoice_items_invoice_id on public.crm_invoice_items(invoice_id);
create index if not exists idx_crm_invoices_customer_id on public.crm_invoices(customer_id);
create index if not exists license_keys_active_idx on public.license_keys(is_active);
create index if not exists license_installations_host_path_idx on public.license_installations(install_host, install_path);
create index if not exists n8n_activation_keys_active_idx on public.n8n_activation_keys(is_active);
create index if not exists n8n_activation_installations_host_path_idx on public.n8n_activation_installations(install_host, install_path);

-- ------------------------------------------
-- Update timestamp trigger
-- ------------------------------------------
create or replace function public.update_property_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  if tg_table_name = 'property-leads' and old.status is distinct from new.status then
    new.status_changed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_update_leads on public."property-leads";
create trigger trg_update_leads
before update on public."property-leads"
for each row
execute function public.update_property_timestamp();

drop trigger if exists trg_update_users on public.users;
create trigger trg_update_users
before update on public.users
for each row
execute function public.update_property_timestamp();

-- ------------------------------------------
-- RLS baseline for internal security
-- App uses server-side DB access; anon/authenticated should be blocked
-- ------------------------------------------
do $$
declare
  tbl text;
  fq_table text;
  policy_name text;
  tables text[] := array[
    'agent_chats',
    'crm_articles',
    'crm_customers',
    'crm_invoice_items',
    'crm_invoices',
    'external_source_replies',
    'property-leads',
    'property-replies',
    'property_notes',
    'property_reporting',
    'license_keys',
    'license_installations',
    'n8n_activation_keys',
    'n8n_activation_installations',
    'users'
  ];
begin
  foreach tbl in array tables loop
    fq_table := format('public.%I', tbl);
    policy_name := format('deny_anon_authenticated_all_on_%s', replace(tbl, '-', '_'));

    execute format('alter table %s enable row level security', fq_table);
    execute format('drop policy if exists %I on %s', policy_name, fq_table);
    execute format(
      'create policy %I on %s as restrictive for all to anon, authenticated using (false) with check (false)',
      policy_name,
      fq_table
    );
  end loop;
end
$$;

-- ------------------------------------------
-- Demo reset function (full rebuild)
-- ------------------------------------------
create or replace function public.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_hash text;
  user_hash text;
  agent_hash text;

  lead_1001_id bigint;
  lead_1002_id bigint;
  lead_1003_id bigint;
  lead_1004_id bigint;

  article_service_id int;
  article_photo_id int;
  article_marketing_id int;

  customer_mueller_id int;
  customer_schmidt_id int;

  invoice_001_id int;
  invoice_002_id int;
begin
  select u.password_hash
  into admin_hash
  from public.users u
  where u.username = 'admin'
  order by u.id desc
  limit 1;

  select u.password_hash
  into user_hash
  from public.users u
  where u.username = 'user'
  order by u.id desc
  limit 1;

  if admin_hash is null then
    admin_hash := 'admin';
  end if;

  if user_hash is null then
    user_hash := 'user';
  end if;

  agent_hash := user_hash;

  truncate table
    public.crm_invoice_items,
    public.crm_invoices,
    public.crm_customers,
    public.crm_articles
  restart identity cascade;

  truncate table
    public.property_notes,
    public.external_source_replies,
    public.property_reporting,
    public."property-replies",
    public."property-leads"
  restart identity cascade;

  truncate table public.agent_chats restart identity cascade;
  truncate table public.users restart identity cascade;

  insert into public.users (username, password_hash, role, display_name)
  values
    ('admin', admin_hash, 'admin', 'Administrator'),
    ('user', user_hash, 'user', 'Teamleitung'),
    ('max.agent', agent_hash, 'agent', 'Max Agent');

  insert into public."property-leads" (
    link,
    title,
    external_id,
    uebergeben_am,
    status,
    kaufpreis,
    email,
    telefonnummer,
    objekttyp,
    plz,
    ort,
    betreut_von,
    notizfeld
  )
  values
    (
      'https://immoweb.example/objekte/demo-1001',
      '2-Zimmer Altbauwohnung mit Balkon',
      'DEMO-1001',
      current_date - 18,
      'Zu vergeben',
      285000,
      'kontakt+1001@open-akquise.demo',
      '+43 660 1111001',
      'Kauf',
      '5020',
      'Salzburg',
      'Max Agent',
      'Demo-Lead: Erstkontakt offen, Expose vorbereitet.'
    ),
    (
      'https://immoweb.example/objekte/demo-1002',
      'Reihenhaus mit Garten und Garage',
      'DEMO-1002',
      current_date - 14,
      'Von GP kontaktiert',
      449000,
      'kontakt+1002@open-akquise.demo',
      '+43 660 1111002',
      'Kauf',
      '5081',
      'Anif',
      'Max Agent',
      'Verkaeufer telefonisch erreicht, Unterlagen angefordert.'
    ),
    (
      'https://immoweb.example/objekte/demo-1003',
      'Baugrundstueck in Seennaehe',
      'DEMO-1003',
      current_date - 11,
      'Aufgenommen',
      365000,
      'kontakt+1003@open-akquise.demo',
      '+43 660 1111003',
      'Grundstueck',
      '5301',
      'Eugendorf',
      'Teamleitung',
      'Objekt aufgenommen, Foto-Termin erfolgt.'
    ),
    (
      'https://immoweb.example/objekte/demo-1004',
      'Penthouse mit Dachterrasse',
      'DEMO-1004',
      current_date - 9,
      'Vermarktung',
      790000,
      'kontakt+1004@open-akquise.demo',
      '+43 660 1111004',
      'Kauf',
      '5020',
      'Salzburg',
      'Max Agent',
      'Inserat live, Besichtigungen laufen.'
    ),
    (
      'https://immoweb.example/objekte/demo-1005',
      'Einfamilienhaus mit Einliegerwohnung',
      'DEMO-1005',
      current_date - 6,
      'Abschluss/Verkauf',
      915000,
      'kontakt+1005@open-akquise.demo',
      '+43 660 1111005',
      'Kauf',
      '5201',
      'Seekirchen',
      'Teamleitung',
      'Notartermin abgeschlossen, Provision verbucht.'
    ),
    (
      'https://immoweb.example/objekte/demo-1006',
      'Sanierungsobjekt in zentraler Lage',
      'DEMO-1006',
      current_date - 4,
      'Follow-up',
      239000,
      'kontakt+1006@open-akquise.demo',
      '+43 660 1111006',
      'Kauf',
      '5400',
      'Hallein',
      'Max Agent',
      'Rueckfrage zu Finanzierung offen, Wiedervorlage gesetzt.'
    );

  select id into lead_1001_id from public."property-leads" where external_id = 'DEMO-1001';
  select id into lead_1002_id from public."property-leads" where external_id = 'DEMO-1002';
  select id into lead_1003_id from public."property-leads" where external_id = 'DEMO-1003';
  select id into lead_1004_id from public."property-leads" where external_id = 'DEMO-1004';

  insert into public.property_notes (property_id, note_text, content, created_by)
  values
    (lead_1001_id, 'Expose als PDF vorbereitet, wartet auf Freigabe.', 'Expose als PDF vorbereitet, wartet auf Freigabe.', 'Teamleitung'),
    (lead_1002_id, 'Rueckruf mit Eigentuemer fuer morgen 10:00 vereinbart.', 'Rueckruf mit Eigentuemer fuer morgen 10:00 vereinbart.', 'Max Agent'),
    (lead_1003_id, 'Lagebewertung abgeschlossen, Vermarktungspreis bestaetigt.', 'Lagebewertung abgeschlossen, Vermarktungspreis bestaetigt.', 'Administrator'),
    (lead_1004_id, 'Zwei qualifizierte Interessenten im Follow-up.', 'Zwei qualifizierte Interessenten im Follow-up.', 'Max Agent');

  insert into public.external_source_replies (external_source_code, reply_message)
  values
    ('DEMO-1001', 'Vielen Dank fuer Ihre Anfrage. Wir melden uns heute mit den Unterlagen.'),
    ('DEMO-1002', 'Besichtigungstermin am Freitag um 15:00 ist vorgemerkt.'),
    ('DEMO-1004', 'Das Expose wurde versendet. Rueckmeldung folgt nach Besichtigung.');

  insert into public.property_reporting (external_id, status, note, ip_address)
  values
    ('DEMO-1002', 'Von GP kontaktiert', 'Erstgespraech erfolgreich abgeschlossen.', '127.0.0.1'),
    ('DEMO-1004', 'Vermarktung', 'Inserat live auf allen Portalen.', '127.0.0.1'),
    ('DEMO-1005', 'Abschluss/Verkauf', 'Abschlussdokumente digital signiert.', '127.0.0.1');

  insert into public."property-replies" (external_source_code, reply_message)
  values
    ('DEMO-1003', 'Die Objektunterlagen wurden erfolgreich nachgereicht.');

  insert into public.crm_articles (title, description, price, unit)
  values
    ('Maklerprovision Verkauf', 'Standardprovision fuer Verkaufsobjekte.', 2500, 'Pauschale'),
    ('Premium Foto Paket', 'Foto- und Drohnenpaket fuer Expose.', 390, 'Paket'),
    ('Marketing Boost', 'Gezielte Portalschaltung fuer 30 Tage.', 690, 'Paket');

  select id into article_service_id from public.crm_articles where title = 'Maklerprovision Verkauf' limit 1;
  select id into article_photo_id from public.crm_articles where title = 'Premium Foto Paket' limit 1;
  select id into article_marketing_id from public.crm_articles where title = 'Marketing Boost' limit 1;

  insert into public.crm_customers (name, email, phone, company, address)
  values
    ('Anna Mueller', 'anna.mueller@example.com', '+43 660 2200110', 'Mueller Immobilien OG', 'Linzer Gasse 1, 5020 Salzburg'),
    ('Lukas Schmidt', 'lukas.schmidt@example.com', '+43 660 2200220', 'Schmidt Real GmbH', 'Musterweg 12, 5081 Anif');

  select id into customer_mueller_id from public.crm_customers where email = 'anna.mueller@example.com' limit 1;
  select id into customer_schmidt_id from public.crm_customers where email = 'lukas.schmidt@example.com' limit 1;

  insert into public.crm_invoices (
    invoice_number,
    customer_id,
    customer_name,
    customer_email,
    customer_address,
    total_amount,
    status,
    issue_date,
    due_date
  )
  values (
    'RE-2026-0001',
    customer_mueller_id,
    'Anna Mueller',
    'anna.mueller@example.com',
    'Linzer Gasse 1, 5020 Salzburg',
    2890,
    'Bezahlt',
    current_date - 12,
    current_date + 18
  )
  returning id into invoice_001_id;

  insert into public.crm_invoices (
    invoice_number,
    customer_id,
    customer_name,
    customer_email,
    customer_address,
    total_amount,
    status,
    issue_date,
    due_date
  )
  values (
    'RE-2026-0002',
    customer_schmidt_id,
    'Lukas Schmidt',
    'lukas.schmidt@example.com',
    'Musterweg 12, 5081 Anif',
    3190,
    'Entwurf',
    current_date - 3,
    current_date + 27
  )
  returning id into invoice_002_id;

  insert into public.crm_invoice_items (
    invoice_id,
    article_id,
    title,
    description,
    quantity,
    unit_price,
    total_price
  )
  values
    (invoice_001_id, article_service_id, 'Maklerprovision Verkauf', 'Objekt DEMO-1005', 1, 2500, 2500),
    (invoice_001_id, article_photo_id, 'Premium Foto Paket', 'Drohne + Innenaufnahmen', 1, 390, 390),
    (invoice_002_id, article_service_id, 'Maklerprovision Verkauf', 'Objekt DEMO-1004', 1, 2500, 2500),
    (invoice_002_id, article_marketing_id, 'Marketing Boost', 'Portalschaltung 30 Tage', 1, 690, 690);

  insert into public.agent_chats (question, answer, created_at)
  values
    (
      'Wie ist der Stand beim Penthouse DEMO-1004?',
      'DEMO-1004 ist in Vermarktung. Zwei Besichtigungen sind bereits erfolgt und wir erwarten zeitnah Rueckmeldungen.',
      now() - interval '2 hours'
    ),
    (
      'Welche Leads brauchen heute Follow-up?',
      'Prioritaet haben DEMO-1002 und DEMO-1006. Bei beiden liegen offene Rueckfragen vor, bitte heute nachfassen.',
      now() - interval '45 minutes'
    );
end;
$$;

-- ------------------------------------------
-- Schedule automatic reset every 30 minutes
-- ------------------------------------------
do $$
declare
  existing_job_id bigint;
begin
  -- Internal test license code:
  --   TEST-OPEN-AKQUISE-2026
  -- SHA-256:
  --   018ab43829db6189331c1e90715867900a20b7294667f4b5ba4b1bac1470d412
  insert into public.license_keys (code_hash, label, is_active, max_installations)
  values (
    '018ab43829db6189331c1e90715867900a20b7294667f4b5ba4b1bac1470d412',
    'INTERNAL_TEST_CODE',
    true,
    null
  )
  on conflict (code_hash)
  do update set is_active = true, updated_at = now();

  -- Internal test n8n activation code:
  --   N8N-TEST-OPEN-AKQUISE-2026
  -- SHA-256:
  --   0acee618449ae8c1b7ad1e19f590bc982c5290a538575c30d9d748cf7aa8109f
  insert into public.n8n_activation_keys (code_hash, label, is_active, max_installations)
  values (
    '0acee618449ae8c1b7ad1e19f590bc982c5290a538575c30d9d748cf7aa8109f',
    'INTERNAL_N8N_TEST_CODE',
    true,
    1
  )
  on conflict (code_hash)
  do update set is_active = true, max_installations = 1, updated_at = now();

  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'demo-data-reset-30min';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'demo-data-reset-30min',
    '*/30 * * * *',
    'select public.reset_demo_data();'
  );
end
$$;

-- Initial seed now
select public.reset_demo_data();

commit;
