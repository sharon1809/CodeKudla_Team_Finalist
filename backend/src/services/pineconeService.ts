import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

const indexName = process.env.PINECONE_INDEX_NAME || 'rag-documents';

/**
 * Get Pinecone Index instance
 */
const getIndex = () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not defined in environment variables');
  }
  return pc.Index(indexName);
};

/**
 * Upsert document text chunks with embeddings into Pinecone
 */
export const upsertDocumentChunks = async (
  documentId: string,
  userId: string,
  filename: string,
  chunks: { text: string; index: number }[],
  embeddings: number[][]
): Promise<void> => {
  try {
    const index = getIndex();

    // Map chunks and embeddings into Pinecone record structure
    const records = chunks.map((chunk, idx) => ({
      id: `${documentId}_${chunk.index}`,
      values: embeddings[idx],
      metadata: {
        documentId,
        userId,
        filename,
        text: chunk.text,
        chunkIndex: chunk.index,
      },
    }));

    // Pinecone has limits on batch upload size. Upload in chunks of 100
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  } catch (error: any) {
    console.error('Pinecone upsert failure:', error);
    throw new Error(`Pinecone upsert failed: ${error.message}`);
  }
};

/**
 * Query Pinecone index for top K relevant chunks using query embedding and metadata filters
 */
export interface QueryResultMatch {
  id: string;
  score?: number;
  metadata?: {
    documentId: string;
    userId: string;
    filename: string;
    text: string;
    chunkIndex: number;
  };
}

export const queryDocumentChunks = async (
  documentId: string,
  userId: string,
  queryEmbedding: number[],
  topK = 5
): Promise<QueryResultMatch[]> => {
  try {
    const index = getIndex();

    const response = await index.query({
      vector: queryEmbedding,
      topK,
      filter: {
        documentId: { $eq: documentId },
        userId: { $eq: userId },
      },
      includeMetadata: true,
    });

    return (response.matches || []) as QueryResultMatch[];
  } catch (error: any) {
    console.error('Pinecone query failure:', error);
    throw new Error(`Pinecone query failed: ${error.message}`);
  }
};

/**
 * Delete all vectors associated with a specific document
 */
export const deleteDocumentChunks = async (
  documentId: string,
  userId: string
): Promise<void> => {
  try {
    const index = getIndex();

    // Delete by metadata filters (supported in Pinecone Serverless and Pods)
    await index.deleteMany({
      filter: {
        documentId: { $eq: documentId },
        userId: { $eq: userId },
      },
    });
  } catch (error: any) {
    console.error('Pinecone deletion failure:', error);
    throw new Error(`Pinecone deletion failed: ${error.message}`);
  }
};
