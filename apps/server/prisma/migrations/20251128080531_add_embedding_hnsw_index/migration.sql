-- Create HNSW index for embedding vector
CREATE INDEX "Work_embedding_HNSW" ON "Work" USING hnsw ("embedding" vector_cosine_ops);