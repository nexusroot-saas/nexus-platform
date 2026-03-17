alter table "public"."appointments" drop constraint "appointments_status_check";

alter table "public"."companies" drop constraint "companies_status_check";

alter table "public"."companies" drop constraint "companies_tenant_type_check";

alter table "public"."consents" drop constraint "consents_status_check";

alter table "public"."users" drop constraint "users_role_check";

alter table "public"."users" drop constraint "users_status_check";

alter table "public"."appointments" add constraint "appointments_status_check" CHECK (((status)::text = ANY ((ARRAY['SCHEDULED'::character varying, 'CONFIRMED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'NO_SHOW'::character varying])::text[]))) not valid;

alter table "public"."appointments" validate constraint "appointments_status_check";

alter table "public"."companies" add constraint "companies_status_check" CHECK (((status)::text = ANY ((ARRAY['TRIAL'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying, 'CANCELLED'::character varying])::text[]))) not valid;

alter table "public"."companies" validate constraint "companies_status_check";

alter table "public"."companies" add constraint "companies_tenant_type_check" CHECK (((tenant_type)::text = ANY ((ARRAY['MED'::character varying, 'CLIN'::character varying, 'ODONTO'::character varying, 'LAB'::character varying, 'IMG'::character varying, 'LEGAL'::character varying, 'ADM'::character varying])::text[]))) not valid;

alter table "public"."companies" validate constraint "companies_tenant_type_check";

alter table "public"."consents" add constraint "consents_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SIGNED'::character varying, 'REFUSED'::character varying, 'EXPIRED'::character varying, 'REVOKED'::character varying])::text[]))) not valid;

alter table "public"."consents" validate constraint "consents_status_check";

alter table "public"."users" add constraint "users_role_check" CHECK (((role)::text = ANY ((ARRAY['ROOT'::character varying, 'TENANT_ADMIN'::character varying, 'MEDICO'::character varying, 'RECEPCIONISTA'::character varying, 'FINANCEIRO'::character varying, 'DPO_EXTERNO'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."users" add constraint "users_status_check" CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_status_check";


