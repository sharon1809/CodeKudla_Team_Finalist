import { Request, Response } from 'express';
import { Document } from '../models/Document';
import { Chat } from '../models/Chat';
import { ReportAnalysis } from '../models/ReportAnalysis';
import { processDocumentPipeline } from '../rag/ragPipeline';
import { deleteUploadedFile } from '../services/storageService';
import { deleteDocumentChunks } from '../services/pgvectorService';
import fs from 'fs';

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
    //general could be 
    const file = req.file;
    const documentType = (req.body.documentType === 'lab_report' ? 'lab_report' : 'general');

    // Trigger processing pipeline
    const docRecord = await processDocumentPipeline({
      filePath: file.path,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      userId,
      documentType,
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
    const documentType = req.query.type as string | undefined;

    const query: any = { owner: userId };
    if (documentType) {
      query.documentType = documentType;
    }

    const documents = await Document.find(query).sort({ createdAt: -1 });
    res.status(200).json({ documents });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving documents', error: error.message });
  }
};

/**
 * Download or view raw document file from local disk
 */
export const getDocumentFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const document = await Document.findOne({ _id: id, owner: userId });
    if (!document || !fs.existsSync(document.localPath)) {
      res.status(404).json({ message: 'Document file not found' });
      return;
    }

    res.setHeader('Content-Type', document.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
    fs.createReadStream(document.localPath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ message: 'Error serving document file', error: error.message });
  }
};

/**
 * Rename a document filename
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
 * Delete a document from MongoDB, local disk, and pgvector
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

    // 1. Delete vectors from pgvector
    console.log(`Deleting pgvector embeddings for document: ${id}`);
    await deleteDocumentChunks(id, userId);

    // 2. Delete file from local disk
    console.log(`Deleting file from disk: ${document.localPath}`);
    deleteUploadedFile(document.localPath);

    // 3. Delete associated chats & lab report analyses
    await Chat.deleteMany({ document: id, owner: userId });
    await ReportAnalysis.deleteMany({ documentId: id, userId });

    // 4. Delete document record from MongoDB
    await Document.deleteOne({ _id: id, owner: userId });

    res.status(200).json({ message: 'Document and all associated data deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};
