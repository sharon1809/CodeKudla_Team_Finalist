"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChat = exports.renameChat = exports.askQuestion = exports.getChatById = exports.getChats = exports.createChat = void 0;
const Chat_1 = require("../models/Chat");
const Document_1 = require("../models/Document");
const embeddingService_1 = require("../services/embeddingService");
const pineconeService_1 = require("../services/pineconeService");
const llmService_1 = require("../services/llmService");
/**
 * Start a new chat session associated with a document
 */
const createChat = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { documentId, title } = req.body;
        if (!documentId) {
            res.status(400).json({ message: 'Document ID is required to start a chat.' });
            return;
        }
        const doc = await Document_1.Document.findOne({ _id: documentId, owner: userId });
        if (!doc) {
            res.status(404).json({ message: 'Document not found or access denied.' });
            return;
        }
        const chatTitle = title || `Chat on ${doc.filename}`;
        const chat = new Chat_1.Chat({
            title: chatTitle,
            owner: userId,
            document: documentId,
            messages: [],
        });
        await chat.save();
        res.status(201).json({ chat });
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating chat session', error: error.message });
    }
};
exports.createChat = createChat;
/**
 * Retrieve all chats for the current user
 */
const getChats = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Populate document metadata for details (like filename)
        const chats = await Chat_1.Chat.find({ owner: userId })
            .populate('document', 'filename cloudinaryUrl uploadDate')
            .sort({ updatedAt: -1 });
        res.status(200).json({ chats });
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving chats', error: error.message });
    }
};
exports.getChats = getChats;
/**
 * Get details and history of a specific chat session
 */
const getChatById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const chat = await Chat_1.Chat.findOne({ _id: id, owner: userId }).populate('document');
        if (!chat) {
            res.status(404).json({ message: 'Chat not found' });
            return;
        }
        res.status(200).json({ chat });
    }
    catch (error) {
        res.status(500).json({ message: 'Error retrieving chat details', error: error.message });
    }
};
exports.getChatById = getChatById;
/**
 * Submit a question to the chat, triggering vector search and LLM completion
 */
const askQuestion = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params; // Chat ID
        const { question } = req.body;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (!question || question.trim().length === 0) {
            res.status(400).json({ message: 'Question cannot be empty' });
            return;
        }
        // 1. Fetch chat history and associated document
        const chat = await Chat_1.Chat.findOne({ _id: id, owner: userId });
        if (!chat) {
            res.status(404).json({ message: 'Chat session not found' });
            return;
        }
        const documentId = chat.document.toString();
        const document = await Document_1.Document.findById(documentId);
        if (!document) {
            res.status(404).json({ message: 'Associated document not found' });
            return;
        }
        // 2. Generate embedding for the question
        console.log(`Generating embedding for question: "${question.substring(0, 30)}..."`);
        const questionEmbedding = await (0, embeddingService_1.getEmbedding)(question);
        // 3. Query Pinecone for relevant context chunks
        console.log(`Querying Pinecone for document: ${documentId}`);
        const matches = await (0, pineconeService_1.queryDocumentChunks)(documentId, userId, questionEmbedding, 5);
        // 4. Send history + question + context to LLM
        console.log(`Generating response using LLM`);
        const { answer, citations } = await (0, llmService_1.generateAnswerWithLLM)(question, chat.messages, matches);
        // 5. Append message history in MongoDB Chat
        const userMessage = {
            role: 'user',
            content: question,
            createdAt: new Date(),
        };
        const assistantMessage = {
            role: 'assistant',
            content: answer,
            citations,
            createdAt: new Date(),
        };
        chat.messages.push(userMessage);
        chat.messages.push(assistantMessage);
        await chat.save();
        res.status(200).json({
            answer: assistantMessage,
            chat,
        });
    }
    catch (error) {
        console.error('Error during Question-Answering RAG process:', error);
        res.status(500).json({
            message: 'Failed to process question. Please try again.',
            error: error.message,
        });
    }
};
exports.askQuestion = askQuestion;
/**
 * Rename a chat session
 */
const renameChat = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { title } = req.body;
        if (!title || title.trim().length === 0) {
            res.status(400).json({ message: 'Title is required' });
            return;
        }
        const chat = await Chat_1.Chat.findOne({ _id: id, owner: userId });
        if (!chat) {
            res.status(404).json({ message: 'Chat not found' });
            return;
        }
        chat.title = title.trim();
        await chat.save();
        res.status(200).json({ message: 'Chat renamed successfully', chat });
    }
    catch (error) {
        res.status(500).json({ message: 'Error renaming chat', error: error.message });
    }
};
exports.renameChat = renameChat;
/**
 * Delete a chat session
 */
const deleteChat = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const result = await Chat_1.Chat.deleteOne({ _id: id, owner: userId });
        if (result.deletedCount === 0) {
            res.status(404).json({ message: 'Chat not found' });
            return;
        }
        res.status(200).json({ message: 'Chat deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting chat', error: error.message });
    }
};
exports.deleteChat = deleteChat;
