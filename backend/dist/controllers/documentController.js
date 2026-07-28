"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.renameDocument = exports.getDocuments = exports.uploadDocument = void 0;
const Document_1 = require("../models/Document");
const Chat_1 = require("../models/Chat");
const ragPipeline_1 = require("../rag/ragPipeline");
const cloudinaryService_1 = require("../services/cloudinaryService");
const pineconeService_1 = require("../services/pineconeService");
/**
 * Handle document upload and trigger the RAG pipeline
 */
const uploadDocument = async (req, res) => {
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
        const docRecord = await (0, ragPipeline_1.processDocumentPipeline)({
            filePath: file.path,
            originalName: file.originalname,
            fileSize: file.size,
            userId,
        });
        res.status(201).json({
            message: 'Document uploaded and indexed successfully.',
            document: docRecord,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error processing and uploading document',
            error: error.message,
        });
    }
};
exports.uploadDocument = uploadDocument;
/**
 * Retrieve list of all uploaded documents for the current user
 */
const getDocuments = async (req, res) => {
    try {
        const userId = req.user?.id;
        const documents = await Document_1.Document.find({ owner: userId }).sort({ createdAt: -1 });
        res.status(200).json({ documents });
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving documents', error: error.message });
    }
};
exports.getDocuments = getDocuments;
/**
 * Rename a document filename (updates metadata in MongoDB)
 */
const renameDocument = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { filename } = req.body;
        if (!filename || filename.trim().length === 0) {
            res.status(400).json({ message: 'Filename is required' });
            return;
        }
        const document = await Document_1.Document.findOne({ _id: id, owner: userId });
        if (!document) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }
        document.filename = filename.trim();
        await document.save();
        res.status(200).json({ message: 'Document renamed successfully', document });
    }
    catch (error) {
        res.status(500).json({ message: 'Error renaming document', error: error.message });
    }
};
exports.renameDocument = renameDocument;
/**
 * Delete a document from MongoDB, Cloudinary, and Pinecone vectors
 */
const deleteDocument = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const document = await Document_1.Document.findOne({ _id: id, owner: userId });
        if (!document) {
            res.status(404).json({ message: 'Document not found' });
            return;
        }
        // 1. Delete vectors from Pinecone
        console.log(`Deleting Pinecone vectors for document: ${id}`);
        await (0, pineconeService_1.deleteDocumentChunks)(id, userId);
        // 2. Delete file from Cloudinary
        console.log(`Deleting file from Cloudinary public_id: ${document.cloudinaryPublicId}`);
        await (0, cloudinaryService_1.deleteFromCloudinary)(document.cloudinaryPublicId);
        // 3. Delete associated chats from MongoDB
        console.log(`Deleting associated chats for document: ${id}`);
        await Chat_1.Chat.deleteMany({ document: id, owner: userId });
        // 4. Delete document record from MongoDB
        await Document_1.Document.deleteOne({ _id: id, owner: userId });
        res.status(200).json({ message: 'Document and all associated indices deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting document', error: error.message });
    }
};
exports.deleteDocument = deleteDocument;
