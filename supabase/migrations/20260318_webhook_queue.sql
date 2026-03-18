-- Tabela fila de webhooks (BullMQ + RLS)
CREATE TABLE public.webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices performance
CREATE INDEX idx_webhook_queue_company_status ON webhook_queue (company_id, status);
CREATE INDEX idx_webhook_queue_scheduled ON webhook_queue (scheduled_at) WHERE status = 'pending';

-- RLS isolamento multi-tenant
ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_queue_policy ON webhook_queue
  FOR ALL USING (company_id = current_setting('app.current_company_id')::UUID);
