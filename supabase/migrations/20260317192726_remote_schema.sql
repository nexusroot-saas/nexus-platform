drop extension if exists "pg_net";

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


