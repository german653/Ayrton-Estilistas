-- Ejecutar DESPUÉS de `prisma migrate deploy`.
-- Aísla filas por tenant a nivel de base de datos: aunque un bug de la
-- aplicación olvide filtrar por tenantId, Postgres igual bloquea el acceso.

CREATE EXTENSION IF NOT EXISTS vector;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','employees','services','customers','appointments',
    'channel_connections','conversations','agent_configs',
    'knowledge_documents','knowledge_chunks','reminders',
    'review_requests','promotions','business_profiles'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t); -- aplica incluso al owner de la tabla
    EXECUTE format('
      CREATE POLICY tenant_isolation ON %I
      USING ("tenantId" = current_setting(''app.current_tenant_id'', true))
      WITH CHECK ("tenantId" = current_setting(''app.current_tenant_id'', true));
    ', t);
  END LOOP;
END $$;

-- Índice vectorial para búsqueda semántica RAG (coseno)
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
