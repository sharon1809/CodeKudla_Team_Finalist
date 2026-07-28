import fs from 'fs';
import path from 'path';
import { extractTextFromFile } from './textExtractor';
import { splitTextIntoChunks } from './textSplitter';
import { getEmbeddings } from '../services/embeddingService';
import { upsertDocumentChunks } from '../services/pineconeService';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { Document } from '../models/Document';
import { Types } from 'mongoose';

interface ProcessDocumentInput {
  filePath: string;
  originalName: string;
  fileSize: number;
  userId: string;
}

export const processDocumentPipeline = async (
  input: ProcessDocumentInput
): Promise<any> => {
  const { filePath, originalName, fileSize, userId } = input;
  const ext = path.extname(originalName);

  try {
    // 1. Extract text from the temporary file
    console.log(`Extracting text from: ${originalName}`);
    const rawText = await extractTextFromFile(filePath, ext);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text content could be extracted from this document.');
    }

    // 2. Chunk text intelligently with overlap
    console.log(`Splitting text into chunks`);
    const chunks = await splitTextIntoChunks(rawText, 1000, 200);
    const chunkCount = chunks.length;
    console.log(`Split text into ${chunkCount} chunks`);

    // 3. Generate embeddings
    console.log(`Generating embeddings for ${chunkCount} chunks`);
    const textsOnly = chunks.map((c) => c.text);
    const embeddings = await getEmbeddings(textsOnly);

    // 4. Upload file to Cloudinary to secure permanent file storage
    console.log(`Uploading file to Cloudinary`);
    const cloudinaryData = await uploadToCloudinary(filePath);

    // 5. Create Document Metadata inside MongoDB
    console.log(`Saving document metadata to MongoDB`);
    const documentRecord = new Document({
      filename: originalName,
      cloudinaryUrl: cloudinaryData.url,
      cloudinaryPublicId: cloudinaryData.publicId,
      owner: new Types.ObjectId(userId),
      fileSize,
      chunkCount,
    });
    await documentRecord.save();

    // 6. Store embeddings inside Pinecone
    console.log(`Upserting embeddings to Pinecone`);
    await upsertDocumentChunks(
      documentRecord._id.toString(),
      userId,
      originalName,
      chunks,
      embeddings
    );

    return documentRecord;
  } catch (error: any) {
    console.error('RAG Pipeline processing failed:', error);
    throw error;
  } finally {
    // 8. Delete temporary file
    if (fs.existsSync(filePath)) {
      console.log(`Cleaning up temporary file: ${filePath}`);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to delete temporary file:', err);
      }
    }
  }
};
