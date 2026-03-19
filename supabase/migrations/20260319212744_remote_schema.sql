drop extension if exists "pg_net";

create type "public"."doctypeenum" as enum ('CONFIDENCIALIDADE', 'TCLE', 'ATESTADOMEDICO', 'RELATORIOMEDICO', 'RECEITASIMPLES', 'RECEITAANTIMICROBIANO', 'RECEITACONTROLEESPECIAL', 'SOLICITACAOEXAMES', 'LAUDO', 'PARECERTECNICO');


  create table "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "companyid" uuid not null,
    "patient_id" uuid not null,
    "professional_id" uuid not null,
    "scheduled_date" timestamp with time zone not null,
    "duration_minutes" integer default 30,
    "status" character varying(20) not null default 'SCHEDULED'::character varying,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "created_by" uuid
      );


alter table "public"."appointments" enable row level security;


  create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "companyid" uuid not null,
    "user_id" uuid not null,
    "action" character varying(50) not null,
    "table_name" character varying(100) not null,
    "record_id" uuid,
    "old_values" jsonb,
    "new_values" jsonb,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."audit_logs" enable row level security;


  create table "public"."companies" (
    "id" uuid not null default gen_random_uuid(),
    "cnpj" character varying(18) not null,
    "nome_fantasia" character varying(200) not null,
    "tenant_type" character varying(20) not null,
    "status" character varying(20) not null default 'TRIAL'::character varying,
    "config_branding" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "razao_social" character varying(255),
    "active_modules" text[] not null default '{}'::text[],
    "trial_expires_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
      );


alter table "public"."companies" enable row level security;


  create table "public"."consents" (
    "id" uuid not null default gen_random_uuid(),
    "companyid" uuid not null,
    "patient_id" uuid not null,
    "term_version" character varying(20) not null,
    "status" character varying(20) not null default 'PENDING'::character varying,
    "signed_at" timestamp with time zone,
    "ip_address" inet,
    "geolocation" character varying(100),
    "term_text_hash" character varying(64),
    "expires_at" timestamp with time zone not null,
    "created_at" timestamp with time zone not null default now(),
    "channel" character varying(20) not null default 'WHATSAPP'::character varying,
    "revoked_at" timestamp with time zone,
    "pdf_url" text,
    "created_by" uuid
      );


alter table "public"."consents" enable row level security;


  create table "public"."documenttemplates" (
    "id" uuid not null default gen_random_uuid(),
    "companyid" uuid,
    "doctype" public.doctypeenum not null,
    "version" integer not null default 1,
    "isactive" boolean not null default true,
    "issystem" boolean not null default false,
    "contenthtml" text not null,
    "lockedsectionshash" text,
    "createdby" uuid,
    "createdat" timestamp with time zone not null default now(),
    "updatedat" timestamp with time zone not null default now()
      );


alter table "public"."documenttemplates" enable row level security;


  create table "public"."patients" (
    "id" uuid not null default gen_random_uuid(),
    "companyid" uuid not null,
    "name" character varying(200) not null,
    "cpf" character varying(14),
    "phone" character varying(20),
    "email" character varying(255),
    "date_of_birth" date,
    "dynamic_data" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "status" character varying(20) not null default 'ATIVO'::character varying,
    "created_by" uuid
      );


alter table "public"."patients" enable row level security;


  create table "public"."refresh_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "token_hash" character varying(255),
    "expires_at" timestamp with time zone not null,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "companyid" uuid,
    "token" text,
    "revoked_at" timestamp with time zone
      );


alter table "public"."refresh_tokens" enable row level security;


  create table "public"."storage_documents" (
    "id" uuid not null default gen_random_uuid(),
    "companyid" uuid not null,
    "bucket" text not null,
    "object_path" text not null,
    "original_name" text,
    "mime_type" text,
    "file_size" integer,
    "sha256_hash" text not null,
    "entity_type" text,
    "entity_id" uuid,
    "uploaded_by" uuid,
    "signed_url_expires_at" timestamp with time zone,
    "retention_until" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."storage_documents" enable row level security;


  create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "companyid" uuid not null,
    "email" character varying(255) not null,
    "password_hash" character varying(255) not null,
    "name" character varying(200) not null,
    "role" character varying(30) not null,
    "status" character varying(20) not null default 'PENDING'::character varying,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "deleted_at" timestamp with time zone,
    "last_login_at" timestamp with time zone
      );


alter table "public"."users" enable row level security;


  create table "public"."webhook_queue" (
    "id" uuid not null default gen_random_uuid(),
    "company_id" uuid not null,
    "webhook_url" text not null,
    "payload" jsonb not null,
    "attempts" integer default 0,
    "last_error" text,
    "status" character varying(20) default 'pending'::character varying,
    "scheduled_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."webhook_queue" enable row level security;

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX companies_cnpj_key ON public.companies USING btree (cnpj);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX consents_pkey ON public.consents USING btree (id);

CREATE UNIQUE INDEX documenttemplates_pkey ON public.documenttemplates USING btree (id);

CREATE INDEX idx_appointments_company ON public.appointments USING btree (companyid);

CREATE INDEX idx_appointments_tenant_date ON public.appointments USING btree (companyid, scheduled_date) WHERE (deleted_at IS NULL);

CREATE INDEX idx_audit_tenant_time ON public.audit_logs USING btree (companyid, created_at DESC);

CREATE INDEX idx_consents_company ON public.consents USING btree (companyid, created_at DESC);

CREATE INDEX idx_consents_patient ON public.consents USING btree (companyid, patient_id, status);

CREATE INDEX idx_doctemplates_company_type ON public.documenttemplates USING btree (companyid, doctype) WHERE (isactive = true);

CREATE INDEX idx_patients_company ON public.patients USING btree (companyid);

CREATE INDEX idx_patients_tenant ON public.patients USING btree (companyid, id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_storage_docs_bucket ON public.storage_documents USING btree (bucket, companyid);

CREATE INDEX idx_storage_docs_company ON public.storage_documents USING btree (companyid);

CREATE INDEX idx_storage_docs_entity ON public.storage_documents USING btree (entity_type, entity_id);

CREATE INDEX idx_users_company ON public.users USING btree (companyid) WHERE (deleted_at IS NULL);

CREATE INDEX idx_webhook_queue_company_status ON public.webhook_queue USING btree (company_id, status);

CREATE INDEX idx_webhook_queue_scheduled ON public.webhook_queue USING btree (scheduled_at) WHERE ((status)::text = 'pending'::text);

CREATE UNIQUE INDEX patients_pkey ON public.patients USING btree (id);

CREATE UNIQUE INDEX refresh_tokens_pkey ON public.refresh_tokens USING btree (id);

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON public.refresh_tokens USING btree (token_hash);

CREATE UNIQUE INDEX storage_documents_pkey ON public.storage_documents USING btree (id);

CREATE UNIQUE INDEX uq_active_template_per_tenant ON public.documenttemplates USING btree (companyid, doctype) WHERE ((isactive = true) AND (companyid IS NOT NULL));

CREATE UNIQUE INDEX uq_system_template_per_type ON public.documenttemplates USING btree (doctype) WHERE ((issystem = true) AND (isactive = true));

CREATE UNIQUE INDEX users_company_id_email_key ON public.users USING btree (companyid, email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX webhook_queue_pkey ON public.webhook_queue USING btree (id);

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."consents" add constraint "consents_pkey" PRIMARY KEY using index "consents_pkey";

alter table "public"."documenttemplates" add constraint "documenttemplates_pkey" PRIMARY KEY using index "documenttemplates_pkey";

alter table "public"."patients" add constraint "patients_pkey" PRIMARY KEY using index "patients_pkey";

alter table "public"."refresh_tokens" add constraint "refresh_tokens_pkey" PRIMARY KEY using index "refresh_tokens_pkey";

alter table "public"."storage_documents" add constraint "storage_documents_pkey" PRIMARY KEY using index "storage_documents_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."webhook_queue" add constraint "webhook_queue_pkey" PRIMARY KEY using index "webhook_queue_pkey";

alter table "public"."appointments" add constraint "appointments_company_id_fkey" FOREIGN KEY (companyid) REFERENCES public.companies(id) not valid;

alter table "public"."appointments" validate constraint "appointments_company_id_fkey";

alter table "public"."appointments" add constraint "appointments_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) not valid;

alter table "public"."appointments" validate constraint "appointments_patient_id_fkey";

alter table "public"."appointments" add constraint "appointments_professional_id_fkey" FOREIGN KEY (professional_id) REFERENCES public.users(id) not valid;

alter table "public"."appointments" validate constraint "appointments_professional_id_fkey";

alter table "public"."appointments" add constraint "appointments_status_check" CHECK (((status)::text = ANY ((ARRAY['SCHEDULED'::character varying, 'CONFIRMED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'NO_SHOW'::character varying])::text[]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."companies" add constraint "companies_cnpj_key" UNIQUE using index "companies_cnpj_key";

alter table "public"."companies" add constraint "companies_status_check" CHECK (((status)::text = ANY ((ARRAY['TRIAL'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying, 'CANCELLED'::character varying])::text[]))) not valid;

alter table "public"."companies" validate constraint "companies_status_check";

alter table "public"."companies" add constraint "companies_tenant_type_check" CHECK (((tenant_type)::text = ANY ((ARRAY['MED'::character varying, 'CLIN'::character varying, 'ODONTO'::character varying, 'LAB'::character varying, 'IMG'::character varying, 'LEGAL'::character varying, 'ADM'::character varying])::text[]))) not valid;

alter table "public"."companies" validate constraint "companies_tenant_type_check";

alter table "public"."consents" add constraint "consents_company_id_fkey" FOREIGN KEY (companyid) REFERENCES public.companies(id) not valid;

alter table "public"."consents" validate constraint "consents_company_id_fkey";

alter table "public"."consents" add constraint "consents_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) not valid;

alter table "public"."consents" validate constraint "consents_patient_id_fkey";

alter table "public"."consents" add constraint "consents_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SIGNED'::character varying, 'REFUSED'::character varying, 'EXPIRED'::character varying, 'REVOKED'::character varying])::text[]))) not valid;

alter table "public"."consents" validate constraint "consents_status_check";

alter table "public"."documenttemplates" add constraint "documenttemplates_companyid_fkey" FOREIGN KEY (companyid) REFERENCES public.companies(id) ON DELETE CASCADE not valid;

alter table "public"."documenttemplates" validate constraint "documenttemplates_companyid_fkey";

alter table "public"."documenttemplates" add constraint "documenttemplates_createdby_fkey" FOREIGN KEY (createdby) REFERENCES public.users(id) not valid;

alter table "public"."documenttemplates" validate constraint "documenttemplates_createdby_fkey";

alter table "public"."patients" add constraint "patients_company_id_fkey" FOREIGN KEY (companyid) REFERENCES public.companies(id) not valid;

alter table "public"."patients" validate constraint "patients_company_id_fkey";

alter table "public"."refresh_tokens" add constraint "refresh_tokens_company_id_fkey" FOREIGN KEY (companyid) REFERENCES public.companies(id) not valid;

alter table "public"."refresh_tokens" validate constraint "refresh_tokens_company_id_fkey";

alter table "public"."refresh_tokens" add constraint "refresh_tokens_token_hash_key" UNIQUE using index "refresh_tokens_token_hash_key";

alter table "public"."refresh_tokens" add constraint "refresh_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."refresh_tokens" validate constraint "refresh_tokens_user_id_fkey";

alter table "public"."storage_documents" add constraint "storage_documents_bucket_check" CHECK ((bucket = ANY (ARRAY['public-assets'::text, 'clinical-docs'::text, 'legal-vault'::text]))) not valid;

alter table "public"."storage_documents" validate constraint "storage_documents_bucket_check";

alter table "public"."storage_documents" add constraint "storage_documents_company_id_fkey" FOREIGN KEY (companyid) REFERENCES public.companies(id) not valid;

alter table "public"."storage_documents" validate constraint "storage_documents_company_id_fkey";

alter table "public"."storage_documents" add constraint "storage_documents_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.users(id) not valid;

alter table "public"."storage_documents" validate constraint "storage_documents_uploaded_by_fkey";

alter table "public"."users" add constraint "users_company_id_email_key" UNIQUE using index "users_company_id_email_key";

alter table "public"."users" add constraint "users_company_id_fkey" FOREIGN KEY (companyid) REFERENCES public.companies(id) not valid;

alter table "public"."users" validate constraint "users_company_id_fkey";

alter table "public"."users" add constraint "users_role_check" CHECK (((role)::text = ANY ((ARRAY['ROOT'::character varying, 'TENANT_ADMIN'::character varying, 'MEDICO'::character varying, 'RECEPCIONISTA'::character varying, 'FINANCEIRO'::character varying, 'DPO_EXTERNO'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."users" add constraint "users_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_status_check";

alter table "public"."webhook_queue" add constraint "webhook_queue_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE not valid;

alter table "public"."webhook_queue" validate constraint "webhook_queue_company_id_fkey";

alter table "public"."webhook_queue" add constraint "webhook_queue_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[]))) not valid;

alter table "public"."webhook_queue" validate constraint "webhook_queue_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.prevent_legal_vault_delete()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.bucket_id = 'legal-vault' THEN
    RAISE EXCEPTION 'legal-vault é imutável — documentos jurídicos não podem ser excluídos (Seção 15 - CFM/LGPD)';
  END IF;
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_document_retention()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.bucket = 'legal-vault' THEN
    NEW.retention_until := NOW() + INTERVAL '20 years';
  ELSIF NEW.bucket = 'clinical-docs' THEN
    NEW.retention_until := NOW() + INTERVAL '10 years';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_tenant_isolation()
 RETURNS TABLE(patient_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY 
  SELECT COUNT(*)::int FROM patients;
END;
$function$
;

create or replace view "public"."v_storage_documents" as  SELECT sd.id,
    sd.companyid,
    sd.bucket,
    sd.object_path,
    sd.original_name,
    sd.mime_type,
    sd.file_size,
    sd.sha256_hash,
    sd.entity_type,
    sd.entity_id,
    sd.uploaded_by,
    sd.signed_url_expires_at,
    sd.retention_until,
    sd.deleted_at,
    sd.created_at,
    c.nome_fantasia AS company_name
   FROM (public.storage_documents sd
     JOIN public.companies c ON ((sd.companyid = c.id)));


grant delete on table "public"."appointments" to "anon";

grant insert on table "public"."appointments" to "anon";

grant references on table "public"."appointments" to "anon";

grant select on table "public"."appointments" to "anon";

grant trigger on table "public"."appointments" to "anon";

grant truncate on table "public"."appointments" to "anon";

grant update on table "public"."appointments" to "anon";

grant delete on table "public"."appointments" to "authenticated";

grant insert on table "public"."appointments" to "authenticated";

grant references on table "public"."appointments" to "authenticated";

grant select on table "public"."appointments" to "authenticated";

grant trigger on table "public"."appointments" to "authenticated";

grant truncate on table "public"."appointments" to "authenticated";

grant update on table "public"."appointments" to "authenticated";

grant delete on table "public"."appointments" to "nexus_app";

grant insert on table "public"."appointments" to "nexus_app";

grant references on table "public"."appointments" to "nexus_app";

grant select on table "public"."appointments" to "nexus_app";

grant trigger on table "public"."appointments" to "nexus_app";

grant truncate on table "public"."appointments" to "nexus_app";

grant update on table "public"."appointments" to "nexus_app";

grant delete on table "public"."appointments" to "nexusapp";

grant insert on table "public"."appointments" to "nexusapp";

grant references on table "public"."appointments" to "nexusapp";

grant select on table "public"."appointments" to "nexusapp";

grant trigger on table "public"."appointments" to "nexusapp";

grant truncate on table "public"."appointments" to "nexusapp";

grant update on table "public"."appointments" to "nexusapp";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "nexus_app";

grant insert on table "public"."audit_logs" to "nexus_app";

grant references on table "public"."audit_logs" to "nexus_app";

grant select on table "public"."audit_logs" to "nexus_app";

grant trigger on table "public"."audit_logs" to "nexus_app";

grant truncate on table "public"."audit_logs" to "nexus_app";

grant update on table "public"."audit_logs" to "nexus_app";

grant delete on table "public"."audit_logs" to "nexusapp";

grant insert on table "public"."audit_logs" to "nexusapp";

grant references on table "public"."audit_logs" to "nexusapp";

grant select on table "public"."audit_logs" to "nexusapp";

grant trigger on table "public"."audit_logs" to "nexusapp";

grant truncate on table "public"."audit_logs" to "nexusapp";

grant update on table "public"."audit_logs" to "nexusapp";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "nexus_app";

grant insert on table "public"."companies" to "nexus_app";

grant references on table "public"."companies" to "nexus_app";

grant select on table "public"."companies" to "nexus_app";

grant trigger on table "public"."companies" to "nexus_app";

grant truncate on table "public"."companies" to "nexus_app";

grant update on table "public"."companies" to "nexus_app";

grant delete on table "public"."companies" to "nexusapp";

grant insert on table "public"."companies" to "nexusapp";

grant references on table "public"."companies" to "nexusapp";

grant select on table "public"."companies" to "nexusapp";

grant trigger on table "public"."companies" to "nexusapp";

grant truncate on table "public"."companies" to "nexusapp";

grant update on table "public"."companies" to "nexusapp";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."consents" to "anon";

grant insert on table "public"."consents" to "anon";

grant references on table "public"."consents" to "anon";

grant select on table "public"."consents" to "anon";

grant trigger on table "public"."consents" to "anon";

grant truncate on table "public"."consents" to "anon";

grant update on table "public"."consents" to "anon";

grant delete on table "public"."consents" to "authenticated";

grant insert on table "public"."consents" to "authenticated";

grant references on table "public"."consents" to "authenticated";

grant select on table "public"."consents" to "authenticated";

grant trigger on table "public"."consents" to "authenticated";

grant truncate on table "public"."consents" to "authenticated";

grant update on table "public"."consents" to "authenticated";

grant delete on table "public"."consents" to "nexus_app";

grant insert on table "public"."consents" to "nexus_app";

grant references on table "public"."consents" to "nexus_app";

grant select on table "public"."consents" to "nexus_app";

grant trigger on table "public"."consents" to "nexus_app";

grant truncate on table "public"."consents" to "nexus_app";

grant update on table "public"."consents" to "nexus_app";

grant delete on table "public"."consents" to "nexusapp";

grant insert on table "public"."consents" to "nexusapp";

grant references on table "public"."consents" to "nexusapp";

grant select on table "public"."consents" to "nexusapp";

grant trigger on table "public"."consents" to "nexusapp";

grant truncate on table "public"."consents" to "nexusapp";

grant update on table "public"."consents" to "nexusapp";

grant delete on table "public"."consents" to "service_role";

grant insert on table "public"."consents" to "service_role";

grant references on table "public"."consents" to "service_role";

grant select on table "public"."consents" to "service_role";

grant trigger on table "public"."consents" to "service_role";

grant truncate on table "public"."consents" to "service_role";

grant update on table "public"."consents" to "service_role";

grant delete on table "public"."documenttemplates" to "anon";

grant insert on table "public"."documenttemplates" to "anon";

grant references on table "public"."documenttemplates" to "anon";

grant select on table "public"."documenttemplates" to "anon";

grant trigger on table "public"."documenttemplates" to "anon";

grant truncate on table "public"."documenttemplates" to "anon";

grant update on table "public"."documenttemplates" to "anon";

grant delete on table "public"."documenttemplates" to "authenticated";

grant insert on table "public"."documenttemplates" to "authenticated";

grant references on table "public"."documenttemplates" to "authenticated";

grant select on table "public"."documenttemplates" to "authenticated";

grant trigger on table "public"."documenttemplates" to "authenticated";

grant truncate on table "public"."documenttemplates" to "authenticated";

grant update on table "public"."documenttemplates" to "authenticated";

grant delete on table "public"."documenttemplates" to "nexus_app";

grant insert on table "public"."documenttemplates" to "nexus_app";

grant references on table "public"."documenttemplates" to "nexus_app";

grant select on table "public"."documenttemplates" to "nexus_app";

grant trigger on table "public"."documenttemplates" to "nexus_app";

grant truncate on table "public"."documenttemplates" to "nexus_app";

grant update on table "public"."documenttemplates" to "nexus_app";

grant delete on table "public"."documenttemplates" to "nexusapp";

grant insert on table "public"."documenttemplates" to "nexusapp";

grant references on table "public"."documenttemplates" to "nexusapp";

grant select on table "public"."documenttemplates" to "nexusapp";

grant trigger on table "public"."documenttemplates" to "nexusapp";

grant truncate on table "public"."documenttemplates" to "nexusapp";

grant update on table "public"."documenttemplates" to "nexusapp";

grant delete on table "public"."documenttemplates" to "service_role";

grant insert on table "public"."documenttemplates" to "service_role";

grant references on table "public"."documenttemplates" to "service_role";

grant select on table "public"."documenttemplates" to "service_role";

grant trigger on table "public"."documenttemplates" to "service_role";

grant truncate on table "public"."documenttemplates" to "service_role";

grant update on table "public"."documenttemplates" to "service_role";

grant delete on table "public"."patients" to "anon";

grant insert on table "public"."patients" to "anon";

grant references on table "public"."patients" to "anon";

grant select on table "public"."patients" to "anon";

grant trigger on table "public"."patients" to "anon";

grant truncate on table "public"."patients" to "anon";

grant update on table "public"."patients" to "anon";

grant delete on table "public"."patients" to "authenticated";

grant insert on table "public"."patients" to "authenticated";

grant references on table "public"."patients" to "authenticated";

grant select on table "public"."patients" to "authenticated";

grant trigger on table "public"."patients" to "authenticated";

grant truncate on table "public"."patients" to "authenticated";

grant update on table "public"."patients" to "authenticated";

grant delete on table "public"."patients" to "nexus_app";

grant insert on table "public"."patients" to "nexus_app";

grant references on table "public"."patients" to "nexus_app";

grant select on table "public"."patients" to "nexus_app";

grant trigger on table "public"."patients" to "nexus_app";

grant truncate on table "public"."patients" to "nexus_app";

grant update on table "public"."patients" to "nexus_app";

grant delete on table "public"."patients" to "nexusapp";

grant insert on table "public"."patients" to "nexusapp";

grant references on table "public"."patients" to "nexusapp";

grant select on table "public"."patients" to "nexusapp";

grant trigger on table "public"."patients" to "nexusapp";

grant truncate on table "public"."patients" to "nexusapp";

grant update on table "public"."patients" to "nexusapp";

grant delete on table "public"."patients" to "service_role";

grant insert on table "public"."patients" to "service_role";

grant references on table "public"."patients" to "service_role";

grant select on table "public"."patients" to "service_role";

grant trigger on table "public"."patients" to "service_role";

grant truncate on table "public"."patients" to "service_role";

grant update on table "public"."patients" to "service_role";

grant delete on table "public"."refresh_tokens" to "anon";

grant insert on table "public"."refresh_tokens" to "anon";

grant references on table "public"."refresh_tokens" to "anon";

grant select on table "public"."refresh_tokens" to "anon";

grant trigger on table "public"."refresh_tokens" to "anon";

grant truncate on table "public"."refresh_tokens" to "anon";

grant update on table "public"."refresh_tokens" to "anon";

grant delete on table "public"."refresh_tokens" to "authenticated";

grant insert on table "public"."refresh_tokens" to "authenticated";

grant references on table "public"."refresh_tokens" to "authenticated";

grant select on table "public"."refresh_tokens" to "authenticated";

grant trigger on table "public"."refresh_tokens" to "authenticated";

grant truncate on table "public"."refresh_tokens" to "authenticated";

grant update on table "public"."refresh_tokens" to "authenticated";

grant delete on table "public"."refresh_tokens" to "nexus_app";

grant insert on table "public"."refresh_tokens" to "nexus_app";

grant references on table "public"."refresh_tokens" to "nexus_app";

grant select on table "public"."refresh_tokens" to "nexus_app";

grant trigger on table "public"."refresh_tokens" to "nexus_app";

grant truncate on table "public"."refresh_tokens" to "nexus_app";

grant update on table "public"."refresh_tokens" to "nexus_app";

grant delete on table "public"."refresh_tokens" to "nexusapp";

grant insert on table "public"."refresh_tokens" to "nexusapp";

grant references on table "public"."refresh_tokens" to "nexusapp";

grant select on table "public"."refresh_tokens" to "nexusapp";

grant trigger on table "public"."refresh_tokens" to "nexusapp";

grant truncate on table "public"."refresh_tokens" to "nexusapp";

grant update on table "public"."refresh_tokens" to "nexusapp";

grant delete on table "public"."refresh_tokens" to "service_role";

grant insert on table "public"."refresh_tokens" to "service_role";

grant references on table "public"."refresh_tokens" to "service_role";

grant select on table "public"."refresh_tokens" to "service_role";

grant trigger on table "public"."refresh_tokens" to "service_role";

grant truncate on table "public"."refresh_tokens" to "service_role";

grant update on table "public"."refresh_tokens" to "service_role";

grant delete on table "public"."storage_documents" to "anon";

grant insert on table "public"."storage_documents" to "anon";

grant references on table "public"."storage_documents" to "anon";

grant select on table "public"."storage_documents" to "anon";

grant trigger on table "public"."storage_documents" to "anon";

grant truncate on table "public"."storage_documents" to "anon";

grant update on table "public"."storage_documents" to "anon";

grant delete on table "public"."storage_documents" to "authenticated";

grant insert on table "public"."storage_documents" to "authenticated";

grant references on table "public"."storage_documents" to "authenticated";

grant select on table "public"."storage_documents" to "authenticated";

grant trigger on table "public"."storage_documents" to "authenticated";

grant truncate on table "public"."storage_documents" to "authenticated";

grant update on table "public"."storage_documents" to "authenticated";

grant delete on table "public"."storage_documents" to "nexus_app";

grant insert on table "public"."storage_documents" to "nexus_app";

grant references on table "public"."storage_documents" to "nexus_app";

grant select on table "public"."storage_documents" to "nexus_app";

grant trigger on table "public"."storage_documents" to "nexus_app";

grant truncate on table "public"."storage_documents" to "nexus_app";

grant update on table "public"."storage_documents" to "nexus_app";

grant delete on table "public"."storage_documents" to "nexusapp";

grant insert on table "public"."storage_documents" to "nexusapp";

grant references on table "public"."storage_documents" to "nexusapp";

grant select on table "public"."storage_documents" to "nexusapp";

grant trigger on table "public"."storage_documents" to "nexusapp";

grant truncate on table "public"."storage_documents" to "nexusapp";

grant update on table "public"."storage_documents" to "nexusapp";

grant delete on table "public"."storage_documents" to "service_role";

grant insert on table "public"."storage_documents" to "service_role";

grant references on table "public"."storage_documents" to "service_role";

grant select on table "public"."storage_documents" to "service_role";

grant trigger on table "public"."storage_documents" to "service_role";

grant truncate on table "public"."storage_documents" to "service_role";

grant update on table "public"."storage_documents" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "nexus_app";

grant insert on table "public"."users" to "nexus_app";

grant references on table "public"."users" to "nexus_app";

grant select on table "public"."users" to "nexus_app";

grant trigger on table "public"."users" to "nexus_app";

grant truncate on table "public"."users" to "nexus_app";

grant update on table "public"."users" to "nexus_app";

grant delete on table "public"."users" to "nexusapp";

grant insert on table "public"."users" to "nexusapp";

grant references on table "public"."users" to "nexusapp";

grant select on table "public"."users" to "nexusapp";

grant trigger on table "public"."users" to "nexusapp";

grant truncate on table "public"."users" to "nexusapp";

grant update on table "public"."users" to "nexusapp";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."webhook_queue" to "anon";

grant insert on table "public"."webhook_queue" to "anon";

grant references on table "public"."webhook_queue" to "anon";

grant select on table "public"."webhook_queue" to "anon";

grant trigger on table "public"."webhook_queue" to "anon";

grant truncate on table "public"."webhook_queue" to "anon";

grant update on table "public"."webhook_queue" to "anon";

grant delete on table "public"."webhook_queue" to "authenticated";

grant insert on table "public"."webhook_queue" to "authenticated";

grant references on table "public"."webhook_queue" to "authenticated";

grant select on table "public"."webhook_queue" to "authenticated";

grant trigger on table "public"."webhook_queue" to "authenticated";

grant truncate on table "public"."webhook_queue" to "authenticated";

grant update on table "public"."webhook_queue" to "authenticated";

grant delete on table "public"."webhook_queue" to "nexus_app";

grant insert on table "public"."webhook_queue" to "nexus_app";

grant references on table "public"."webhook_queue" to "nexus_app";

grant select on table "public"."webhook_queue" to "nexus_app";

grant trigger on table "public"."webhook_queue" to "nexus_app";

grant truncate on table "public"."webhook_queue" to "nexus_app";

grant update on table "public"."webhook_queue" to "nexus_app";

grant delete on table "public"."webhook_queue" to "nexusapp";

grant insert on table "public"."webhook_queue" to "nexusapp";

grant references on table "public"."webhook_queue" to "nexusapp";

grant select on table "public"."webhook_queue" to "nexusapp";

grant trigger on table "public"."webhook_queue" to "nexusapp";

grant truncate on table "public"."webhook_queue" to "nexusapp";

grant update on table "public"."webhook_queue" to "nexusapp";

grant delete on table "public"."webhook_queue" to "service_role";

grant insert on table "public"."webhook_queue" to "service_role";

grant references on table "public"."webhook_queue" to "service_role";

grant select on table "public"."webhook_queue" to "service_role";

grant trigger on table "public"."webhook_queue" to "service_role";

grant truncate on table "public"."webhook_queue" to "service_role";

grant update on table "public"."webhook_queue" to "service_role";


  create policy "tenant_isolation_appointments"
  on "public"."appointments"
  as permissive
  for all
  to public
using (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "tenant_isolation_audit"
  on "public"."audit_logs"
  as permissive
  for all
  to public
using (((companyid)::text = current_setting('app.current_company_id'::text, true)));



  create policy "tenant_isolation_audit_logs"
  on "public"."audit_logs"
  as permissive
  for all
  to public
using (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "tenant_isolation_consents"
  on "public"."consents"
  as permissive
  for all
  to public
using (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "dt_delete"
  on "public"."documenttemplates"
  as permissive
  for delete
  to public
using (((companyid = (current_setting('app.currentcompanyid'::text, true))::uuid) AND (issystem = false)));



  create policy "dt_insert"
  on "public"."documenttemplates"
  as permissive
  for insert
  to public
with check (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "dt_select"
  on "public"."documenttemplates"
  as permissive
  for select
  to public
using ((((companyid)::text = current_setting('app.currentcompanyid'::text, true)) OR (issystem = true)));



  create policy "dt_update"
  on "public"."documenttemplates"
  as permissive
  for update
  to public
using (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "tenant_isolation_documenttemplates"
  on "public"."documenttemplates"
  as permissive
  for all
  to public
using (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "tenant_isolation_patients"
  on "public"."patients"
  as permissive
  for all
  to nexusapp
using ((companyid = (current_setting('app.currentcompanyid'::text))::uuid))
with check ((companyid = (current_setting('app.currentcompanyid'::text))::uuid));



  create policy "tenant_isolation_refresh_tokens"
  on "public"."refresh_tokens"
  as permissive
  for all
  to public
using (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "tenant_isolation_storage_documents"
  on "public"."storage_documents"
  as permissive
  for all
  to public
using (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "tenant_isolation_users"
  on "public"."users"
  as permissive
  for all
  to public
using (((companyid)::text = current_setting('app.currentcompanyid'::text, true)));



  create policy "webhook_queue_policy"
  on "public"."webhook_queue"
  as permissive
  for all
  to public
using ((company_id = (current_setting('app.current_company_id'::text))::uuid));


CREATE TRIGGER trg_set_document_retention BEFORE INSERT ON public.storage_documents FOR EACH ROW EXECUTE FUNCTION public.set_document_retention();


  create policy "clinical_docs_tenant_delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'clinical-docs'::text) AND ((storage.foldername(name))[1] = current_setting('app.current_company_id'::text, true))));



  create policy "clinical_docs_tenant_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'clinical-docs'::text) AND ((storage.foldername(name))[1] = current_setting('app.current_company_id'::text, true))));



  create policy "clinical_docs_tenant_write"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'clinical-docs'::text) AND ((storage.foldername(name))[1] = current_setting('app.current_company_id'::text, true))));



  create policy "legal_vault_tenant_insert"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'legal-vault'::text) AND ((storage.foldername(name))[1] = current_setting('app.current_company_id'::text, true))));



  create policy "legal_vault_tenant_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'legal-vault'::text) AND ((storage.foldername(name))[1] = current_setting('app.current_company_id'::text, true))));



  create policy "public_assets_read_all"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'public-assets'::text));



  create policy "public_assets_write_own_company"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'public-assets'::text) AND ((storage.foldername(name))[1] = current_setting('app.current_company_id'::text, true))));


CREATE TRIGGER trg_prevent_legal_vault_delete BEFORE DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION public.prevent_legal_vault_delete();


