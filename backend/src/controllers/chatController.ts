import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Document } from '../models/Document';
import { getQueryEmbedding, runDocumentChatChain } from '../services/langchainService';
import { queryDocumentChunks } from '../services/pgvectorService';
import { IMessage } from '../types';

/**
 * Start a new chat session associated with a document
 */
export const createChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { documentId, title } = req.body;

    if (!documentId) {
      res.status(400).json({ message: 'Document ID is required to start a chat.' });
      return;
    }

    const doc = await Document.findOne({ _id: documentId, owner: userId });
    if (!doc) {
      res.status(404).json({ message: 'Document not found or access denied.' });
      return;
    }

    const chatTitle = title || `Chat on ${doc.filename}`;

    const chat = new Chat({
      title: chatTitle,
      owner: userId,
      document: documentId,
      messages: [],
    });

    await chat.save();

    res.status(201).json({ chat });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating chat session', error: error.message });
  }
};

/**
 * Retrieve all chats for the current user
 */
export const getChats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const chats = await Chat.find({ owner: userId })
      .populate('document', 'filename documentType uploadDate')
      .sort({ updatedAt: -1 });

    res.status(200).json({ chats });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving chats', error: error.message });
  }
};

/**
 * Get details and history of a specific chat session
 */
export const getChatById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const chat = await Chat.findOne({ _id: id, owner: userId }).populate('document');
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    res.status(200).json({ chat });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving chat details', error: error.message });
  }
};

/**
 * Submit a question to the chat, triggering vector search and LangChain RAG
 */
export const askQuestion = async (req: Request, res: Response): Promise<void> => {
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
    const chat = await Chat.findOne({ _id: id, owner: userId });
    if (!chat) {
      res.status(404).json({ message: 'Chat session not found' });
      return;
    }

    const documentId = chat.document.toString();
    const document = await Document.findById(documentId);
    if (!document) {
      res.status(404).json({ message: 'Associated document not found' });
      return;
    }

    // 2. Generate embedding for question via LangChain Gemini Embeddings
    console.log(`Generating embedding for query: "${question.substring(0, 40)}..."`);
    const questionEmbedding = await getQueryEmbedding(question);

    // 3. Query pgvector for relevant context chunks
    // For lab reports retrieve top 10 chunks, for general documents retrieve top 6
    const topK = document.documentType === 'lab_report' ? 10 : 6;
    console.log(`Querying pgvector for document: ${documentId} (topK=${topK})`);
    const matches = await queryDocumentChunks(userId, questionEmbedding, topK, { documentId });

    // 4. Run LangChain LCEL RAG Chain
    console.log(`Executing LangChain RAG Chain...`);
    const { answer, citations } = await runDocumentChatChain(
      question,
      chat.messages,
      matches
    );

    // 5. Append message history in MongoDB Chat
    const userMessage: IMessage = {
      role: 'user',
      content: question,
      createdAt: new Date(),
    };

    const assistantMessage: IMessage = {
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
  } catch (error: any) {
    console.error('Error during Question-Answering RAG process:', error);
    res.status(500).json({
      message: 'Failed to process question. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Rename a chat session
 */
export const renameChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const chat = await Chat.findOne({ _id: id, owner: userId });
    if (!chat) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    chat.title = title.trim();
    await chat.save();

    res.status(200).json({ message: 'Chat renamed successfully', chat });
  } catch (error: any) {
    res.status(500).json({ message: 'Error renaming chat', error: error.message });
  }
};

/**
 * Delete a chat session
 */
export const deleteChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await Chat.deleteOne({ _id: id, owner: userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Chat not found' });
      return;
    }

    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting chat', error: error.message });
  }
};
