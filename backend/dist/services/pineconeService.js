"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocumentChunks = exports.queryDocumentChunks = exports.upsertDocumentChunks = void 0;
const pinecone_1 = require("@pinecone-database/pinecone");
const pc = new pinecone_1.Pinecone({
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
const upsertDocumentChunks = async (documentId, userId, filename, chunks, embeddings) => {
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
    }
    catch (error) {
        console.error('Pinecone upsert failure:', error);
        throw new Error(`Pinecone upsert failed: ${error.message}`);
    }
};
exports.upsertDocumentChunks = upsertDocumentChunks;
const queryDocumentChunks = async (documentId, userId, queryEmbedding, topK = 5) => {
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
        return (response.matches || []);
    }
    catch (error) {
        console.error('Pinecone query failure:', error);
        throw new Error(`Pinecone query failed: ${error.message}`);
    }
};
exports.queryDocumentChunks = queryDocumentChunks;
/**
 * Delete all vectors associated with a specific document
 */
const deleteDocumentChunks = async (documentId, userId) => {
    try {
        const index = getIndex();
        // Delete by metadata filters (supported in Pinecone Serverless and Pods)
        await index.deleteMany({
            filter: {
                documentId: { $eq: documentId },
                userId: { $eq: userId },
            },
        });
    }
    catch (error) {
        console.error('Pinecone deletion failure:', error);
        throw new Error(`Pinecone deletion failed: ${error.message}`);
    }
};
exports.deleteDocumentChunks = deleteDocumentChunks;
