-- Cria o usuário de aplicação nexus_app (não-owner, sujeito ao RLS)
-- NUNCA usar o usuário 'nexus' (owner) em queries da aplicação

CREATE USER nexus_app WITH PASSWORD 'nexus_app_pass';
GRANT CONNECT ON DATABASE nexus_dev TO nexus_app;
GRANT USAGE ON SCHEMA public TO nexus_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nexus_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nexus_app;
