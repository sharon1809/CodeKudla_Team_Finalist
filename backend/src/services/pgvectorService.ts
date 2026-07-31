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

    const sanitizedFilename = filename.replace(/\u0000/g, '');

    // Insert in batches of 50 using multi-row queries to optimize execution and avoid socket conflicts
    const batchSize = 50;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      
      const valueLines: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      for (let j = 0; j < batchChunks.length; j++) {
        const chunk = batchChunks[j];
        const idx = i + j;
        const embeddingStr = `[${embeddings[idx].join(',')}]`;
        const sanitizedContent = chunk.text.replace(/\u0000/g, '');

        valueLines.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}::vector, $${paramIdx++})`
        );

        const metadataPayload = {
          documentId,
          userId,
          filename: sanitizedFilename,
          documentType,
          chunkIndex: chunk.index,
          totalChunks: chunks.length,
          chunkLength: sanitizedContent.length,
          uploadedAt: new Date().toISOString()
        };

        params.push(
          documentId,
          userId,
          sanitizedFilename,
          documentType,
          chunk.index,
          sanitizedContent,
          embeddingStr,
          JSON.stringify(metadataPayload)
        );
      }

      const query = `
        INSERT INTO ${TABLE}
          (document_id, user_id, filename, document_type, chunk_index, content, embedding, metadata)
        VALUES ${valueLines.join(', ')}
      `;

      await client.query(query, params);
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
    queryText?: string;
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

  // 1. Fetch Keyword/Text Search Results if queryText is provided
  let textResults: any[] = [];
  if (options.queryText) {
    try {
      const searchTerms = options.queryText
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(term => term.length > 1)
        .join(' | ');

      if (searchTerms) {
        const textQuery = `
          SELECT
            id::text,
            document_id,
            user_id,
            filename,
            document_type,
            chunk_index,
            content,
            metadata,
            ts_rank_cd(to_tsvector('english', content), to_tsquery('english', $${paramIdx})) as score
          FROM ${TABLE}
          WHERE ${whereClause}
            AND to_tsvector('english', content) @@ to_tsquery('english', $${paramIdx})
          ORDER BY score DESC
          LIMIT $${paramIdx + 1}
        `;
        
        const textParams = [...params, searchTerms, topK];
        const textRes = await pool.query(textQuery, textParams);
        textResults = textRes.rows.map((row) => ({
          ...row,
          score: parseFloat(row.score)
        }));
      }
    } catch (err) {
      console.warn('⚠️ Hybrid Search full-text query failed, falling back to pure vector:', err);
    }
  }

  // 2. Fetch Vector Search Results
  const vectorQuery = `
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

  const vectorParams = [...params, embeddingStr, topK * 2];
  const vectorRes = await pool.query(vectorQuery, vectorParams);
  const vectorResults = vectorRes.rows.map((row) => ({
    ...row,
    score: parseFloat(row.score)
  }));

  // 3. Perform Reciprocal Rank Fusion (RRF) to merge vector and text search results
  let finalResults = vectorResults;
  if (textResults.length > 0) {
    const rrfMap = new Map<string, { row: any; rrfScore: number }>();

    // Add vector results with a rank weight
    vectorResults.forEach((row, rank) => {
      const rrfScore = 1.0 / (60.0 + (rank + 1));
      rrfMap.set(row.id, { row, rrfScore });
    });

    // Merge keyword text results
    textResults.forEach((row, rank) => {
      const textRrf = 1.0 / (60.0 + (rank + 1));
      if (rrfMap.has(row.id)) {
        const item = rrfMap.get(row.id)!;
        item.rrfScore += textRrf;
        item.row.score = Math.max(item.row.score, 0.5) + 0.1; // Boost relevance score
      } else {
        row.score = Math.min(row.score, 0.4); // Normalize text score
        rrfMap.set(row.id, { row, rrfScore: textRrf });
      }
    });

    finalResults = Array.from(rrfMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .map((item) => item.row)
      .slice(0, topK);
  } else {
    finalResults = vectorResults.slice(0, topK);
  }

  return finalResults.map((row) => ({
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
