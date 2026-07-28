import { getPgPool } from '../config/database';
import { VectorMatch, DocumentType } from '../types';

const TABLE = 'document_embeddings';

/**
 * Upsert document text chunks with their embeddings into pgvector.
 * Uses a batch INSERT for performance.
 */
export const upsertDocumentChunks = async (
  documentId: string,
  userId: string,
  filename: string,
  documentType: DocumentType,
  chunks: { text: string; index: number }[],
  embeddings: number[][]
): Promise<void> => {
  const pool = getPgPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete any existing chunks for this document (for re-processing)
    await client.query(
      `DELETE FROM ${TABLE} WHERE document_id = $1 AND user_id = $2`,
      [documentId, userId]
    );

    // Batch insert all chunks
    const insertPromises = chunks.map(async (chunk, idx) => {
      const embeddingStr = `[${embeddings[idx].join(',')}]`;
      return client.query(
        `INSERT INTO ${TABLE}
          (document_id, user_id, filename, document_type, chunk_index, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)`,
        [
          documentId,
          userId,
          filename,
          documentType,
          chunk.index,
          chunk.text,
          embeddingStr,
          JSON.stringify({ chunkIndex: chunk.index, filename, documentType }),
        ]
      );
    });

    // Execute in batches of 50 to avoid overwhelming the connection
    const batchSize = 50;
    for (let i = 0; i < insertPromises.length; i += batchSize) {
      await Promise.all(insertPromises.slice(i, i + batchSize));
    }

    await client.query('COMMIT');
    console.log(`✅ Upserted ${chunks.length} chunks for document ${documentId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Query pgvector for the most similar chunks using cosine similarity.
 * Optionally filters by documentId and/or documentType.
 */
export const queryDocumentChunks = async (
  userId: string,
  queryEmbedding: number[],
  topK: number = 5,
  options: {
    documentId?: string;
    documentType?: DocumentType;
    minScore?: number;
  } = {}
): Promise<VectorMatch[]> => {
  const pool = getPgPool();
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Build dynamic WHERE clause
  const conditions: string[] = ['user_id = $1'];
  const params: any[] = [userId];
  let paramIdx = 2;

  if (options.documentId) {
    conditions.push(`document_id = $${paramIdx++}`);
    params.push(options.documentId);
  }

  if (options.documentType) {
    conditions.push(`document_type = $${paramIdx++}`);
    params.push(options.documentType);
  }

  const whereClause = conditions.join(' AND ');
  const minScore = options.minScore ?? 0.0;

  const query = `
    SELECT
      id::text,
      document_id,
      user_id,
      filename,
      document_type,
      chunk_index,
      content,
      metadata,
      1 - (embedding <=> $${paramIdx}::vector) AS score
    FROM ${TABLE}
    WHERE ${whereClause}
      AND 1 - (embedding <=> $${paramIdx}::vector) > ${minScore}
    ORDER BY embedding <=> $${paramIdx}::vector
    LIMIT $${paramIdx + 1}
  `;

  params.push(embeddingStr, topK);

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    userId: row.user_id,
    filename: row.filename,
    documentType: row.document_type as DocumentType,
    chunkIndex: row.chunk_index,
    content: row.content,
    score: parseFloat(row.score),
    metadata: row.metadata || {},
  }));
};

/**
 * Delete all vector chunks for a specific document.
 */
export const deleteDocumentChunks = async (
  documentId: string,
  userId: string
): Promise<void> => {
  const pool = getPgPool();
  const result = await pool.query(
    `DELETE FROM ${TABLE} WHERE document_id = $1 AND user_id = $2`,
    [documentId, userId]
  );
  console.log(`✅ Deleted ${result.rowCount} chunks for document ${documentId}`);
};

/**
 * Get chunk count for a specific document.
 */
export const getChunkCount = async (documentId: string): Promise<number> => {
  const pool = getPgPool();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM ${TABLE} WHERE document_id = $1`,
    [documentId]
  );
  return result.rows[0]?.count || 0;
};
