DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nexusapp') THEN
      CREATE ROLE nexusapp LOGIN;
   END IF;
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nexus_app') THEN
      CREATE ROLE nexus_app LOGIN;
   END IF;
END
$$;
