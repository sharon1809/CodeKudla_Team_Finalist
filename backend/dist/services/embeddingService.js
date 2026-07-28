"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddings = exports.getEmbedding = void 0;
const openai_1 = __importDefault(require("openai"));
const genai_1 = require("@google/genai");
const provider = (process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();
let openai = null;
let gemini = null;
if (provider === 'openai') {
    openai = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY || '',
    });
}
else {
    // Default to Gemini
    gemini = new genai_1.GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || '',
    });
}
/**
 * Generate embedding for a single text query
 */
const getEmbedding = async (text) => {
    try {
        if (provider === 'openai') {
            if (!openai)
                throw new Error('OpenAI client not initialized');
            const response = await openai.embeddings.create({
                model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
                input: text,
            });
            return response.data[0].embedding;
        }
        else {
            if (!gemini)
                throw new Error('Gemini client not initialized');
            const modelName = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
            const response = await gemini.models.embedContent({
                model: modelName,
                contents: text,
            });
            if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
                return response.embeddings[0].values;
            }
            throw new Error('Invalid embedding response from Gemini API');
        }
    }
    catch (error) {
        console.error(`Embedding generation failed using provider ${provider}:`, error);
        throw new Error(`Embedding generation failed: ${error.message}`);
    }
};
exports.getEmbedding = getEmbedding;
/**
 * Generate embeddings for a batch of text chunks
 */
const getEmbeddings = async (texts) => {
    try {
        if (texts.length === 0)
            return [];
        if (provider === 'openai') {
            if (!openai)
                throw new Error('OpenAI client not initialized');
            const response = await openai.embeddings.create({
                model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
                input: texts,
            });
            return response.data.map((item) => item.embedding);
        }
        else {
            if (!gemini)
                throw new Error('Gemini client not initialized');
            const modelName = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
            // Gemini's embedContent supports batching but through mapping individual tasks or calling embedContent with list of contents depending on the model.
            // To be safe, robust and avoid rate limits or shape mismatches, we can do it in parallel or simple sequential batching.
            // Let's call embedContent on each text chunk in parallel
            const embeddingPromises = texts.map(async (text) => {
                const response = await gemini.models.embedContent({
                    model: modelName,
                    contents: text,
                });
                if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
                    return response.embeddings[0].values;
                }
                throw new Error('Invalid embedding response from Gemini API');
            });
            return Promise.all(embeddingPromises);
        }
    }
    catch (error) {
        console.error(`Batch embedding generation failed using provider ${provider}:`, error);
        throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
};
exports.getEmbeddings = getEmbeddings;
