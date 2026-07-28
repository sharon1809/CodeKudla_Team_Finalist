import { Request, Response } from 'express';
import { Document } from '../models/Document';
import { Chat } from '../models/Chat';
import { processDocumentPipeline } from '../rag/ragPipeline';
import { deleteFromCloudinary } from '../services/cloudinaryService';
import { deleteDocumentChunks } from '../services/pineconeService';

/**
 * Handle document upload and trigger the RAG pipeline
 */
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded or file type is not supported.' });
      return;
    }

    const file = req.file;

    // Trigger processing pipeline
    const docRecord = await processDocumentPipeline({
      filePath: file.path,
      originalName: file.originalname,
      fileSize: file.size,
      userId,
    });

    res.status(201).json({
      message: 'Document uploaded and indexed successfully.',
      document: docRecord,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error processing and uploading document',
      error: error.message,
    });
  }
};

/**
 * Retrieve list of all uploaded documents for the current user
 */
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const documents = await Document.find({ owner: userId }).sort({ createdAt: -1 });
    res.status(200).json({ documents });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving documents', error: error.message });
  }
};

/**
 * Rename a document filename (updates metadata in MongoDB)
 */
export const renameDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { filename } = req.body;

    if (!filename || filename.trim().length === 0) {
      res.status(400).json({ message: 'Filename is required' });
      return;
    }

    const document = await Document.findOne({ _id: id, owner: userId });
    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    document.filename = filename.trim();
    await document.save();

    res.status(200).json({ message: 'Document renamed successfully', document });
  } catch (error: any) {
    res.status(500).json({ message: 'Error renaming document', error: error.message });
  }
};

/**
 * Delete a document from MongoDB, Cloudinary, and Pinecone vectors
 */
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const document = await Document.findOne({ _id: id, owner: userId });
    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // 1. Delete vectors from Pinecone
    console.log(`Deleting Pinecone vectors for document: ${id}`);
    await deleteDocumentChunks(id, userId);

    // 2. Delete file from Cloudinary
    console.log(`Deleting file from Cloudinary public_id: ${document.cloudinaryPublicId}`);
    await deleteFromCloudinary(document.cloudinaryPublicId);

    // 3. Delete associated chats from MongoDB
    console.log(`Deleting associated chats for document: ${id}`);
    await Chat.deleteMany({ document: id, owner: userId });

    // 4. Delete document record from MongoDB
    await Document.deleteOne({ _id: id, owner: userId });

    res.status(200).json({ message: 'Document and all associated indices deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};
