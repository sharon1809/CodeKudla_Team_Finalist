import path from 'path';
import { extractTextFromFile } from './textExtractor';
import { splitTextIntoChunks } from './textSplitter';
import { getBatchEmbeddings } from '../services/langchainService';
import { upsertDocumentChunks } from '../services/pgvectorService';
import { saveUploadedFile, cleanupTempFile } from '../services/storageService';
import { Document } from '../models/Document';
import { Types } from 'mongoose';
import { DocumentType } from '../types';

interface ProcessDocumentInput {
  filePath: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  userId: string;
  documentType?: DocumentType;
}

export const processDocumentPipeline = async (
  input: ProcessDocumentInput
): Promise<any> => {
  const { filePath, originalName, fileSize, mimeType, userId, documentType = 'general' } = input;
  const ext = path.extname(originalName);

  try {
    // 1. Extract text (with OCR fallback for scanned lab reports/documents)
    console.log(`Extracting text from: ${originalName} (Type: ${documentType})`);
    const rawText = await extractTextFromFile(filePath, ext, mimeType);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text content could be extracted from this document.');
    }

    // 2. Chunk text intelligently with overlap
    // For lab reports, chunk size is smaller (500) to keep lab parameters precise
    const chunkSize = documentType === 'lab_report' ? 500 : 1000;//500 words 
    const chunkOverlap = documentType === 'lab_report' ? 100 : 200; 

    console.log(`Splitting text into chunks (size: ${chunkSize}, overlap: ${chunkOverlap})`);
    const chunks = await splitTextIntoChunks(rawText, chunkSize, chunkOverlap);
    const chunkCount = chunks.length;
    console.log(`Split text into ${chunkCount} chunks`);//optimize the values

    // 3. Generate embeddings via LangChain Gemini Embeddings
    console.log(`Generating embeddings for ${chunkCount} chunks`);
    const textsOnly = chunks.map((c) => c.text);
    const embeddings = await getBatchEmbeddings(textsOnly);//opemrouter

    // 4. Compress and save file permanently to Supabase Storage
    console.log(`Compressing and saving file to Supabase Storage`);
    const permanentPath = await saveUploadedFile(filePath, originalName, userId);

    // 5. Create Document Metadata in MongoDB
    console.log(`Saving document metadata to MongoDB`);
    const documentRecord = new Document({
      filename: originalName,
      localPath: permanentPath,
      mimeType,
      owner: new Types.ObjectId(userId),
      fileSize,
      chunkCount,
      documentType,
      processingStatus: 'ready',
    });
    await documentRecord.save();

    // 6. Store embeddings in PostgreSQL pgvector
    console.log(`Upserting embeddings to pgvector`);
    await upsertDocumentChunks(
      documentRecord._id.toString(),
      userId,
      originalName,
      documentType,
      chunks,
      embeddings
    );//postgres  with batches

    return documentRecord;
  } catch (error: any) {
    console.error('RAG Pipeline processing failed:', error);
    // Cleanup temporary upload on error
    cleanupTempFile(filePath);
    throw error;
  }
};
