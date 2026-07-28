"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDocumentPipeline = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const textExtractor_1 = require("./textExtractor");
const textSplitter_1 = require("./textSplitter");
const embeddingService_1 = require("../services/embeddingService");
const pineconeService_1 = require("../services/pineconeService");
const cloudinaryService_1 = require("../services/cloudinaryService");
const Document_1 = require("../models/Document");
const mongoose_1 = require("mongoose");
const processDocumentPipeline = async (input) => {
    const { filePath, originalName, fileSize, userId } = input;
    const ext = path_1.default.extname(originalName);
    try {
        // 1. Extract text from the temporary file
        console.log(`Extracting text from: ${originalName}`);
        const rawText = await (0, textExtractor_1.extractTextFromFile)(filePath, ext);
        if (!rawText || rawText.trim().length === 0) {
            throw new Error('No text content could be extracted from this document.');
        }
        // 2. Chunk text intelligently with overlap
        console.log(`Splitting text into chunks`);
        const chunks = await (0, textSplitter_1.splitTextIntoChunks)(rawText, 1000, 200);
        const chunkCount = chunks.length;
        console.log(`Split text into ${chunkCount} chunks`);
        // 3. Generate embeddings
        console.log(`Generating embeddings for ${chunkCount} chunks`);
        const textsOnly = chunks.map((c) => c.text);
        const embeddings = await (0, embeddingService_1.getEmbeddings)(textsOnly);
        // 4. Upload file to Cloudinary to secure permanent file storage
        console.log(`Uploading file to Cloudinary`);
        const cloudinaryData = await (0, cloudinaryService_1.uploadToCloudinary)(filePath);
        // 5. Create Document Metadata inside MongoDB
        console.log(`Saving document metadata to MongoDB`);
        const documentRecord = new Document_1.Document({
            filename: originalName,
            cloudinaryUrl: cloudinaryData.url,
            cloudinaryPublicId: cloudinaryData.publicId,
            owner: new mongoose_1.Types.ObjectId(userId),
            fileSize,
            chunkCount,
        });
        await documentRecord.save();
        // 6. Store embeddings inside Pinecone
        console.log(`Upserting embeddings to Pinecone`);
        await (0, pineconeService_1.upsertDocumentChunks)(documentRecord._id.toString(), userId, originalName, chunks, embeddings);
        return documentRecord;
    }
    catch (error) {
        console.error('RAG Pipeline processing failed:', error);
        throw error;
    }
    finally {
        // 8. Delete temporary file
        if (fs_1.default.existsSync(filePath)) {
            console.log(`Cleaning up temporary file: ${filePath}`);
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (err) {
                console.error('Failed to delete temporary file:', err);
            }
        }
    }
};
exports.processDocumentPipeline = processDocumentPipeline;
