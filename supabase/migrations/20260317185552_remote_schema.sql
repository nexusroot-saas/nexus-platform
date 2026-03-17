


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."doctypeenum" AS ENUM (
    'CONFIDENCIALIDADE',
    'TCLE',
    'ATESTADOMEDICO',
    'RELATORIOMEDICO',
    'RECEITASIMPLES',
    'RECEITAANTIMICROBIANO',
    'RECEITACONTROLEESPECIAL',
    'SOLICITACAOEXAMES',
    'LAUDO',
    'PARECERTECNICO'
);


ALTER TYPE "public"."doctypeenum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_legal_vault_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF OLD.bucket_id = 'legal-vault' THEN
    RAISE EXCEPTION 'legal-vault é imutável — documentos jurídicos não podem ser excluídos (Seção 15 - CFM/LGPD)';
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_legal_vault_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_document_retention"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.bucket = 'legal-vault' THEN
    NEW.retention_until := NOW() + INTERVAL '20 years';
  ELSIF NEW.bucket = 'clinical-docs' THEN
    NEW.retention_until := NOW() + INTERVAL '10 years';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_document_retention"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_tenant_isolation"() RETURNS TABLE("patient_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY 
  SELECT COUNT(*)::int FROM patients;
END;
$$;


ALTER FUNCTION "public"."test_tenant_isolation"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "companyid" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "professional_id" "uuid" NOT NULL,
    "scheduled_date" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 30,
    "status" character varying(20) DEFAULT 'SCHEDULED'::character varying NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_by" "uuid",
    CONSTRAINT "appointments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['SCHEDULED'::character varying, 'CONFIRMED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'NO_SHOW'::character varying])::"text"[])))
);

ALTER TABLE ONLY "public"."appointments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "companyid" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(50) NOT NULL,
    "table_name" character varying(100) NOT NULL,
    "record_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."audit_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cnpj" character varying(18) NOT NULL,
    "nome_fantasia" character varying(200) NOT NULL,
    "tenant_type" character varying(20) NOT NULL,
    "status" character varying(20) DEFAULT 'TRIAL'::character varying NOT NULL,
    "config_branding" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "razao_social" character varying(255),
    "active_modules" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "trial_expires_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "companies_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['TRIAL'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying, 'CANCELLED'::character varying])::"text"[]))),
    CONSTRAINT "companies_tenant_type_check" CHECK ((("tenant_type")::"text" = ANY ((ARRAY['MED'::character varying, 'CLIN'::character varying, 'ODONTO'::character varying, 'LAB'::character varying, 'IMG'::character varying, 'LEGAL'::character varying, 'ADM'::character varying])::"text"[])))
);

ALTER TABLE ONLY "public"."companies" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "companyid" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "term_version" character varying(20) NOT NULL,
    "status" character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    "signed_at" timestamp with time zone,
    "ip_address" "inet",
    "geolocation" character varying(100),
    "term_text_hash" character varying(64),
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "channel" character varying(20) DEFAULT 'WHATSAPP'::character varying NOT NULL,
    "revoked_at" timestamp with time zone,
    "pdf_url" "text",
    "created_by" "uuid",
    CONSTRAINT "consents_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['PENDING'::character varying, 'SIGNED'::character varying, 'REFUSED'::character varying, 'EXPIRED'::character varying, 'REVOKED'::character varying])::"text"[])))
);

ALTER TABLE ONLY "public"."consents" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documenttemplates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "companyid" "uuid",
    "doctype" "public"."doctypeenum" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "isactive" boolean DEFAULT true NOT NULL,
    "issystem" boolean DEFAULT false NOT NULL,
    "contenthtml" "text" NOT NULL,
    "lockedsectionshash" "text",
    "createdby" "uuid",
    "createdat" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedat" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."documenttemplates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "companyid" "uuid" NOT NULL,
    "name" character varying(200) NOT NULL,
    "cpf" character varying(14),
    "phone" character varying(20),
    "email" character varying(255),
    "date_of_birth" "date",
    "dynamic_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'ATIVO'::character varying NOT NULL,
    "created_by" "uuid"
);

ALTER TABLE ONLY "public"."patients" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refresh_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_hash" character varying(255),
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "companyid" "uuid",
    "token" "text",
    "revoked_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."refresh_tokens" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."refresh_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."storage_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "companyid" "uuid" NOT NULL,
    "bucket" "text" NOT NULL,
    "object_path" "text" NOT NULL,
    "original_name" "text",
    "mime_type" "text",
    "file_size" integer,
    "sha256_hash" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "uploaded_by" "uuid",
    "signed_url_expires_at" timestamp with time zone,
    "retention_until" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "storage_documents_bucket_check" CHECK (("bucket" = ANY (ARRAY['public-assets'::"text", 'clinical-docs'::"text", 'legal-vault'::"text"])))
);


ALTER TABLE "public"."storage_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "companyid" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "password_hash" character varying(255) NOT NULL,
    "name" character varying(200) NOT NULL,
    "role" character varying(30) NOT NULL,
    "status" character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "last_login_at" timestamp with time zone,
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['ROOT'::character varying, 'TENANT_ADMIN'::character varying, 'MEDICO'::character varying, 'RECEPCIONISTA'::character varying, 'FINANCEIRO'::character varying, 'DPO_EXTERNO'::character varying])::"text"[]))),
    CONSTRAINT "users_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'BLOCKED'::character varying])::"text"[])))
);

ALTER TABLE ONLY "public"."users" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_storage_documents" AS
 SELECT "sd"."id",
    "sd"."companyid",
    "sd"."bucket",
    "sd"."object_path",
    "sd"."original_name",
    "sd"."mime_type",
    "sd"."file_size",
    "sd"."sha256_hash",
    "sd"."entity_type",
    "sd"."entity_id",
    "sd"."uploaded_by",
    "sd"."signed_url_expires_at",
    "sd"."retention_until",
    "sd"."deleted_at",
    "sd"."created_at",
    "c"."nome_fantasia" AS "company_name"
   FROM ("public"."storage_documents" "sd"
     JOIN "public"."companies" "c" ON (("sd"."companyid" = "c"."id")));


ALTER VIEW "public"."v_storage_documents" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_cnpj_key" UNIQUE ("cnpj");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consents"
    ADD CONSTRAINT "consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documenttemplates"
    ADD CONSTRAINT "documenttemplates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "public"."storage_documents"
    ADD CONSTRAINT "storage_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_company_id_email_key" UNIQUE ("companyid", "email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_appointments_company" ON "public"."appointments" USING "btree" ("companyid");



CREATE INDEX "idx_appointments_tenant_date" ON "public"."appointments" USING "btree" ("companyid", "scheduled_date") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_audit_tenant_time" ON "public"."audit_logs" USING "btree" ("companyid", "created_at" DESC);



CREATE INDEX "idx_consents_company" ON "public"."consents" USING "btree" ("companyid", "created_at" DESC);



CREATE INDEX "idx_consents_patient" ON "public"."consents" USING "btree" ("companyid", "patient_id", "status");



CREATE INDEX "idx_doctemplates_company_type" ON "public"."documenttemplates" USING "btree" ("companyid", "doctype") WHERE ("isactive" = true);



CREATE INDEX "idx_patients_company" ON "public"."patients" USING "btree" ("companyid");



CREATE INDEX "idx_patients_tenant" ON "public"."patients" USING "btree" ("companyid", "id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_storage_docs_bucket" ON "public"."storage_documents" USING "btree" ("bucket", "companyid");



CREATE INDEX "idx_storage_docs_company" ON "public"."storage_documents" USING "btree" ("companyid");



CREATE INDEX "idx_storage_docs_entity" ON "public"."storage_documents" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_users_company" ON "public"."users" USING "btree" ("companyid") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "uq_active_template_per_tenant" ON "public"."documenttemplates" USING "btree" ("companyid", "doctype") WHERE (("isactive" = true) AND ("companyid" IS NOT NULL));



CREATE UNIQUE INDEX "uq_system_template_per_type" ON "public"."documenttemplates" USING "btree" ("doctype") WHERE (("issystem" = true) AND ("isactive" = true));



CREATE OR REPLACE TRIGGER "trg_set_document_retention" BEFORE INSERT ON "public"."storage_documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_document_retention"();



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_company_id_fkey" FOREIGN KEY ("companyid") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."consents"
    ADD CONSTRAINT "consents_company_id_fkey" FOREIGN KEY ("companyid") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."consents"
    ADD CONSTRAINT "consents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id");



ALTER TABLE ONLY "public"."documenttemplates"
    ADD CONSTRAINT "documenttemplates_companyid_fkey" FOREIGN KEY ("companyid") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documenttemplates"
    ADD CONSTRAINT "documenttemplates_createdby_fkey" FOREIGN KEY ("createdby") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_company_id_fkey" FOREIGN KEY ("companyid") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_company_id_fkey" FOREIGN KEY ("companyid") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."storage_documents"
    ADD CONSTRAINT "storage_documents_company_id_fkey" FOREIGN KEY ("companyid") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."storage_documents"
    ADD CONSTRAINT "storage_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("companyid") REFERENCES "public"."companies"("id");



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documenttemplates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dt_delete" ON "public"."documenttemplates" FOR DELETE USING ((("companyid" = ("current_setting"('app.currentcompanyid'::"text", true))::"uuid") AND ("issystem" = false)));



CREATE POLICY "dt_insert" ON "public"."documenttemplates" FOR INSERT WITH CHECK ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



CREATE POLICY "dt_select" ON "public"."documenttemplates" FOR SELECT USING (((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)) OR ("issystem" = true)));



CREATE POLICY "dt_update" ON "public"."documenttemplates" FOR UPDATE USING ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."storage_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant_isolation_appointments" ON "public"."appointments" USING ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



CREATE POLICY "tenant_isolation_audit" ON "public"."audit_logs" USING ((("companyid")::"text" = "current_setting"('app.current_company_id'::"text", true)));



CREATE POLICY "tenant_isolation_audit_logs" ON "public"."audit_logs" USING ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



CREATE POLICY "tenant_isolation_consents" ON "public"."consents" USING ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



CREATE POLICY "tenant_isolation_documenttemplates" ON "public"."documenttemplates" USING ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



CREATE POLICY "tenant_isolation_patients" ON "public"."patients" TO "nexusapp" USING (("companyid" = ("current_setting"('app.currentcompanyid'::"text"))::"uuid")) WITH CHECK (("companyid" = ("current_setting"('app.currentcompanyid'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_refresh_tokens" ON "public"."refresh_tokens" USING ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



CREATE POLICY "tenant_isolation_storage_documents" ON "public"."storage_documents" USING ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



CREATE POLICY "tenant_isolation_users" ON "public"."users" USING ((("companyid")::"text" = "current_setting"('app.currentcompanyid'::"text", true)));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "nexus_app";
GRANT USAGE ON SCHEMA "public" TO "nexusapp";

























































































































































GRANT ALL ON FUNCTION "public"."prevent_legal_vault_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_legal_vault_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_legal_vault_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_document_retention"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_document_retention"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_document_retention"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_tenant_isolation"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_tenant_isolation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_tenant_isolation"() TO "service_role";


















GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";
GRANT ALL ON TABLE "public"."appointments" TO "nexus_app";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";
GRANT ALL ON TABLE "public"."audit_logs" TO "nexus_app";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";
GRANT ALL ON TABLE "public"."companies" TO "nexus_app";



GRANT ALL ON TABLE "public"."consents" TO "anon";
GRANT ALL ON TABLE "public"."consents" TO "authenticated";
GRANT ALL ON TABLE "public"."consents" TO "service_role";
GRANT ALL ON TABLE "public"."consents" TO "nexus_app";



GRANT ALL ON TABLE "public"."documenttemplates" TO "anon";
GRANT ALL ON TABLE "public"."documenttemplates" TO "authenticated";
GRANT ALL ON TABLE "public"."documenttemplates" TO "service_role";
GRANT ALL ON TABLE "public"."documenttemplates" TO "nexus_app";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";
GRANT ALL ON TABLE "public"."patients" TO "nexus_app";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."patients" TO "nexusapp";



GRANT ALL ON TABLE "public"."refresh_tokens" TO "anon";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "service_role";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "nexus_app";



GRANT ALL ON TABLE "public"."storage_documents" TO "anon";
GRANT ALL ON TABLE "public"."storage_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."storage_documents" TO "service_role";
GRANT ALL ON TABLE "public"."storage_documents" TO "nexus_app";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT ALL ON TABLE "public"."users" TO "nexus_app";



GRANT ALL ON TABLE "public"."v_storage_documents" TO "anon";
GRANT ALL ON TABLE "public"."v_storage_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."v_storage_documents" TO "service_role";
GRANT ALL ON TABLE "public"."v_storage_documents" TO "nexus_app";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "nexus_app";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "nexus_app";































