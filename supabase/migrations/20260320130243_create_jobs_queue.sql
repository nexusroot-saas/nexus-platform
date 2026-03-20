-- Tabela BullMQ Jobs (essencial para filas WhatsApp)
CREATE TABLE IF NOT EXISTS "queue_jobs" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  opts JSONB NOT NULL DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  failed_reason TEXT,
  processed_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para isolamento multi-tenant
ALTER TABLE "queue_jobs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "queue_jobs_select" ON "queue_jobs" FOR SELECT USING (true);
CREATE POLICY "queue_jobs_insert" ON "queue_jobs" FOR INSERT WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_queue_jobs_next_attempt ON "queue_jobs"(next_attempt_at) WHERE next_attempt_at IS NOT NULL;
CREATE INDEX idx_queue_jobs_name ON "queue_jobs"(name);
