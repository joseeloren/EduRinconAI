-- Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar que se creó
SELECT * FROM pg_extension WHERE extname = 'vector';
