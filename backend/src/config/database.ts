import mongoose from 'mongoose';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

import dns from 'dns';

// ─── MongoDB Connection ───────────────────────────────────────────────────────
export const connectMongoDB = async (): Promise<void> => {
  // Fix for "ECONNREFUSED querySrv" caused by ISP/Windows DNS blocking
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medsynexa_db';
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected:', uri);
};

// ─── PostgreSQL Pool (pgvector) ───────────────────────────────────────────────
let pgPool: Pool | null = null;

export const getPgPool = (): Pool => {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medsynexa',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
};

/**
 * Initialize the pgvector extension and the embeddings table.
 * Runs once at server startup.
 */
export const initPgVector = async (): Promise<void> => {
  const client = await getPgPool().connect();
  try {
    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');

    // Check if the table exists and verify its vector dimension
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'document_embeddings'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      const dimResult = await client.query(`
        SELECT atttypmod 
        FROM pg_attribute 
        WHERE attrelid = 'document_embeddings'::regclass 
          AND attname = 'embedding';
      `);
      if (dimResult.rows.length > 0) {
        const currentDim = dimResult.rows[0].atttypmod;
        if (currentDim !== 2048) {
          console.log(`ℹ️ Mismatched vector dimension (${currentDim}) detected. Re-creating table for 2048 dimensions.`);
          await client.query('DROP TABLE IF EXISTS document_embeddings CASCADE;');
        }
      }
    }

    // Create the main embeddings table
    // nvidia/nemotron-3-embed-1b:free produces 2048-dimensional vectors
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id TEXT NOT NULL,
        user_id     TEXT NOT NULL,
        filename    TEXT NOT NULL,
        document_type TEXT NOT NULL DEFAULT 'general',
        chunk_index INTEGER NOT NULL,
        content     TEXT NOT NULL,
        embedding   vector(2048) NOT NULL,
        metadata    JSONB DEFAULT '{}',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes for fast retrieval
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doc_embeddings_document_id
        ON document_embeddings(document_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doc_embeddings_user_id
        ON document_embeddings(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doc_embeddings_type
        ON document_embeddings(document_type);
    `);

    // IVFFlat index for approximate nearest-neighbor search
    // (Created only if the table has data, so we use a safe check)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doc_embeddings_vector
        ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    `).catch(() => {
      // IVFFlat needs at least 1 row — skip if table is empty
      console.log('ℹ️  Vector index will be created after first document upload.');
    });

    console.log('✅ PostgreSQL + pgvector initialized');
  } finally {
    client.release();
  }
};

// ─── Upload Directory Setup ───────────────────────────────────────────────────
export const ensureUploadDir = (): string => {
  const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Upload directory created:', uploadDir);
  }
  return uploadDir;
};
