drop trigger if exists "trg_appointments_updated_at" on "public"."appointments";

drop trigger if exists "trg_companies_updated_at" on "public"."companies";

drop trigger if exists "trg_patients_updated_at" on "public"."patients";

drop trigger if exists "trg_users_updated_at" on "public"."users";

drop policy "tenant_isolation_audit_logs" on "public"."audit_logs";

drop policy "tenant_isolation_companies" on "public"."companies";

drop policy "tenant_isolation_refresh_tokens" on "public"."refresh_tokens";

alter table "public"."appointments" drop constraint "appointments_created_by_fkey";

alter table "public"."audit_logs" drop constraint "audit_logs_company_id_fkey";

alter table "public"."audit_logs" drop constraint "audit_logs_user_id_fkey";

alter table "public"."consents" drop constraint "consents_created_by_fkey";

alter table "public"."patients" drop constraint "patients_created_by_fkey";

alter table "public"."refresh_tokens" drop constraint "refresh_tokens_token_key";

alter table "public"."users" drop constraint "users_email_company_unique";

alter table "public"."appointments" drop constraint "appointments_company_id_fkey";

alter table "public"."appointments" drop constraint "appointments_patient_id_fkey";

alter table "public"."consents" drop constraint "consents_company_id_fkey";

alter table "public"."consents" drop constraint "consents_patient_id_fkey";

alter table "public"."patients" drop constraint "patients_company_id_fkey";

alter table "public"."refresh_tokens" drop constraint "refresh_tokens_company_id_fkey";

alter table "public"."refresh_tokens" drop constraint "refresh_tokens_user_id_fkey";

alter table "public"."users" drop constraint "users_company_id_fkey";

drop function if exists "public"."update_updated_at"();

drop index if exists "public"."idx_appointments_company_date";

drop index if exists "public"."idx_appointments_company_id";

drop index if exists "public"."idx_appointments_patient";

drop index if exists "public"."idx_audit_logs_company_date";

drop index if exists "public"."idx_audit_logs_company_id";

drop index if exists "public"."idx_audit_logs_record";

drop index if exists "public"."idx_consents_company_id";

drop index if exists "public"."idx_consents_status";

drop index if exists "public"."idx_patients_company_id";

drop index if exists "public"."idx_patients_company_name";

drop index if exists "public"."idx_patients_cpf";

drop index if exists "public"."idx_refresh_tokens_token";

drop index if exists "public"."idx_refresh_tokens_user";

drop index if exists "public"."idx_users_company_id";

drop index if exists "public"."idx_users_email";

drop index if exists "public"."refresh_tokens_token_key";

drop index if exists "public"."users_email_company_unique";

drop index if exists "public"."idx_consents_patient";

alter table "public"."appointments" alter column "duration_minutes" drop not null;

alter table "public"."appointments" alter column "professional_id" set not null;

alter table "public"."appointments" alter column "status" set default 'SCHEDULED'::character varying;

alter table "public"."appointments" alter column "status" set data type character varying(20) using "status"::character varying(20);

alter table "public"."audit_logs" alter column "action" set data type character varying(50) using "action"::character varying(50);

alter table "public"."audit_logs" alter column "ip_address" set data type inet using "ip_address"::inet;

alter table "public"."audit_logs" alter column "user_id" set not null;

alter table "public"."companies" alter column "cnpj" set not null;

alter table "public"."companies" alter column "config_branding" drop not null;

alter table "public"."companies" alter column "nome_fantasia" set data type character varying(200) using "nome_fantasia"::character varying(200);

alter table "public"."companies" alter column "status" set default 'TRIAL'::character varying;

alter table "public"."companies" alter column "status" set data type character varying(20) using "status"::character varying(20);

alter table "public"."companies" alter column "tenant_type" drop default;

alter table "public"."companies" alter column "tenant_type" set data type character varying(20) using "tenant_type"::character varying(20);

alter table "public"."consents" alter column "expires_at" set not null;

alter table "public"."consents" alter column "geolocation" set data type character varying(100) using "geolocation"::character varying(100);

alter table "public"."consents" alter column "ip_address" set data type inet using "ip_address"::inet;

alter table "public"."consents" alter column "status" set default 'PENDING'::character varying;

alter table "public"."consents" alter column "status" set data type character varying(20) using "status"::character varying(20);

alter table "public"."consents" alter column "term_text_hash" drop not null;

alter table "public"."consents" alter column "term_text_hash" set data type character varying(64) using "term_text_hash"::character varying(64);

alter table "public"."patients" alter column "dynamic_data" drop not null;

alter table "public"."patients" alter column "name" set data type character varying(200) using "name"::character varying(200);

alter table "public"."refresh_tokens" add column "token_hash" character varying(255);

alter table "public"."refresh_tokens" add column "used_at" timestamp with time zone;

alter table "public"."refresh_tokens" alter column "company_id" drop not null;

alter table "public"."refresh_tokens" alter column "token" drop not null;

alter table "public"."users" alter column "name" set data type character varying(200) using "name"::character varying(200);

alter table "public"."users" alter column "password_hash" set data type character varying(255) using "password_hash"::character varying(255);

alter table "public"."users" alter column "role" drop default;

alter table "public"."users" alter column "role" set data type character varying(30) using "role"::character varying(30);

alter table "public"."users" alter column "status" set default 'PENDING'::character varying;

alter table "public"."users" alter column "status" set data type character varying(20) using "status"::character varying(20);

drop type "public"."appointment_status";

drop type "public"."company_status";

drop type "public"."consent_status";

drop type "public"."tenant_type";

drop type "public"."user_role";

drop type "public"."user_status";

CREATE INDEX idx_appointments_tenant_date ON public.appointments USING btree (company_id, scheduled_date) WHERE (deleted_at IS NULL);

CREATE INDEX idx_audit_tenant_time ON public.audit_logs USING btree (company_id, created_at DESC);

CREATE INDEX idx_patients_tenant ON public.patients USING btree (company_id, id) WHERE (deleted_at IS NULL);

CREATE INDEX idx_users_company ON public.users USING btree (company_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX refresh_tokens_token_hash_key ON public.refresh_tokens USING btree (token_hash);

CREATE UNIQUE INDEX users_company_id_email_key ON public.users USING btree (company_id, email);

CREATE INDEX idx_consents_patient ON public.consents USING btree (company_id, patient_id, status);

alter table "public"."appointments" add constraint "appointments_status_check" CHECK (((status)::text = ANY ((ARRAY['SCHEDULED'::character varying, 'CONFIRMED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'NO_SHOW'::character varying])::text[]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."companies" add constraint "companies_status_check" CHECK (((status)::text = ANY ((ARRAY['TRIAL'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying, 'CANCELLED'::character varying])::text[]))) not valid;

alter table "public"."companies" validate constraint "companies_status_check";

alter table "public"."companies" add constraint "companies_tenant_type_check" CHECK (((tenant_type)::text = ANY ((ARRAY['MED'::character varying, 'CLIN'::character varying, 'ODONTO'::character varying, 'LAB'::character varying, 'IMG'::character varying, 'LEGAL'::character varying, 'ADM'::character varying])::text[]))) not valid;

alter table "public"."companies" validate constraint "companies_tenant_type_check";

alter table "public"."consents" add constraint "consents_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SIGNED'::character varying, 'REFUSED'::character varying, 'EXPIRED'::character varying, 'REVOKED'::character varying])::text[]))) not valid;

alter table "public"."consents" validate constraint "consents_status_check";

alter table "public"."refresh_tokens" add constraint "refresh_tokens_token_hash_key" UNIQUE using index "refresh_tokens_token_hash_key";

alter table "public"."users" add constraint "users_company_id_email_key" UNIQUE using index "users_company_id_email_key";

alter table "public"."users" add constraint "users_role_check" CHECK (((role)::text = ANY ((ARRAY['TENANT_ADMIN'::character varying, 'MEDICO'::character varying, 'RECEPCIONISTA'::character varying, 'FINANCEIRO'::character varying, 'DPO_EXTERNO'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."users" add constraint "users_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_status_check";

alter table "public"."appointments" add constraint "appointments_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) not valid;

alter table "public"."appointments" validate constraint "appointments_company_id_fkey";

alter table "public"."appointments" add constraint "appointments_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) not valid;

alter table "public"."appointments" validate constraint "appointments_patient_id_fkey";

alter table "public"."consents" add constraint "consents_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) not valid;

alter table "public"."consents" validate constraint "consents_company_id_fkey";

alter table "public"."consents" add constraint "consents_patient_id_fkey" FOREIGN KEY (patient_id) REFERENCES public.patients(id) not valid;

alter table "public"."consents" validate constraint "consents_patient_id_fkey";

alter table "public"."patients" add constraint "patients_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) not valid;

alter table "public"."patients" validate constraint "patients_company_id_fkey";

alter table "public"."refresh_tokens" add constraint "refresh_tokens_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) not valid;

alter table "public"."refresh_tokens" validate constraint "refresh_tokens_company_id_fkey";

alter table "public"."refresh_tokens" add constraint "refresh_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) not valid;

alter table "public"."refresh_tokens" validate constraint "refresh_tokens_user_id_fkey";

alter table "public"."users" add constraint "users_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) not valid;

alter table "public"."users" validate constraint "users_company_id_fkey";

grant delete on table "public"."appointments" to "nexus_app";

grant insert on table "public"."appointments" to "nexus_app";

grant references on table "public"."appointments" to "nexus_app";

grant select on table "public"."appointments" to "nexus_app";

grant trigger on table "public"."appointments" to "nexus_app";

grant truncate on table "public"."appointments" to "nexus_app";

grant update on table "public"."appointments" to "nexus_app";

grant delete on table "public"."audit_logs" to "nexus_app";

grant insert on table "public"."audit_logs" to "nexus_app";

grant references on table "public"."audit_logs" to "nexus_app";

grant select on table "public"."audit_logs" to "nexus_app";

grant trigger on table "public"."audit_logs" to "nexus_app";

grant truncate on table "public"."audit_logs" to "nexus_app";

grant update on table "public"."audit_logs" to "nexus_app";

grant delete on table "public"."companies" to "nexus_app";

grant insert on table "public"."companies" to "nexus_app";

grant references on table "public"."companies" to "nexus_app";

grant select on table "public"."companies" to "nexus_app";

grant trigger on table "public"."companies" to "nexus_app";

grant truncate on table "public"."companies" to "nexus_app";

grant update on table "public"."companies" to "nexus_app";

grant delete on table "public"."consents" to "nexus_app";

grant insert on table "public"."consents" to "nexus_app";

grant references on table "public"."consents" to "nexus_app";

grant select on table "public"."consents" to "nexus_app";

grant trigger on table "public"."consents" to "nexus_app";

grant truncate on table "public"."consents" to "nexus_app";

grant update on table "public"."consents" to "nexus_app";

grant delete on table "public"."patients" to "nexus_app";

grant insert on table "public"."patients" to "nexus_app";

grant references on table "public"."patients" to "nexus_app";

grant select on table "public"."patients" to "nexus_app";

grant trigger on table "public"."patients" to "nexus_app";

grant truncate on table "public"."patients" to "nexus_app";

grant update on table "public"."patients" to "nexus_app";

grant delete on table "public"."refresh_tokens" to "nexus_app";

grant insert on table "public"."refresh_tokens" to "nexus_app";

grant references on table "public"."refresh_tokens" to "nexus_app";

grant select on table "public"."refresh_tokens" to "nexus_app";

grant trigger on table "public"."refresh_tokens" to "nexus_app";

grant truncate on table "public"."refresh_tokens" to "nexus_app";

grant update on table "public"."refresh_tokens" to "nexus_app";

grant delete on table "public"."users" to "nexus_app";

grant insert on table "public"."users" to "nexus_app";

grant references on table "public"."users" to "nexus_app";

grant select on table "public"."users" to "nexus_app";

grant trigger on table "public"."users" to "nexus_app";

grant truncate on table "public"."users" to "nexus_app";

grant update on table "public"."users" to "nexus_app";


  create policy "tenant_isolation_audit"
  on "public"."audit_logs"
  as permissive
  for all
  to public
using (((company_id)::text = current_setting('app.current_company_id'::text, true)));



