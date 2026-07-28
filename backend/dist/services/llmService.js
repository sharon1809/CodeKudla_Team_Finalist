"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAnswerWithLLM = void 0;
const openai_1 = __importDefault(require("openai"));
const genai_1 = require("@google/genai");
const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
let openai = null;
let gemini = null;
let openrouter = null;
if (provider === 'openai') {
    openai = new openai_1.default({
        apiKey: process.env.OPENAI_API_KEY || '',
    });
}
else if (provider === 'openrouter') {
    openrouter = new openai_1.default({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY || '',
        defaultHeaders: {
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'RAG Document Analysis Platform',
        },
    });
}
else {
    // Default to Gemini
    gemini = new genai_1.GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || '',
    });
}
/**
 * Interface with the selected LLM provider and generate an answer using context chunks
 */
const generateAnswerWithLLM = async (question, chatHistory, contextChunks) => {
    try {
        // 1. Build the Context description
        let contextText = '';
        const citations = [];
        contextChunks.forEach((match, index) => {
            const text = match.metadata?.text || '';
            const chunkIndex = match.metadata?.chunkIndex ?? index;
            const sourceName = match.metadata?.filename || 'Document';
            contextText += `[Citation Block ${index + 1}] Source: ${sourceName}, Index: ${chunkIndex}\nContent: "${text}"\n\n`;
            citations.push({
                text,
                chunkIndex,
                sourceName,
            });
        });
        // 2. Construct the System Prompt instructions
        const systemInstruction = `You are an expert AI Document Analysis Assistant. Your goal is to provide helpful, comprehensive, and accurate answers to questions based ONLY on the provided context chunks.

CONTEXT CHUNKS:
${contextText || 'No relevant context was found in the document.'}

INSTRUCTIONS:
- Answer the user's question using the provided context chunks.
- If you use information from a context chunk, you MUST cite it at the end of the sentence or paragraph by adding a marker like [Citation Block X] (where X is the number of the Citation Block, e.g. [Citation Block 1]).
- Rely ONLY on the clear facts in the context. Do not assume or extrapolate.
- If the context does not contain enough information to answer the question, state that clearly (e.g., "I'm sorry, but the provided document does not contain information to answer that question.").
- Output your answer in clean Markdown format. Use bullet points, headers, or bold text to structure the output nicely.`;
        let answer = '';
        if (provider === 'openai') {
            if (!openai)
                throw new Error('OpenAI client not initialized');
            const messages = [
                { role: 'system', content: systemInstruction },
                ...chatHistory.map((msg) => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                })),
                { role: 'user', content: question },
            ];
            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
                messages,
                temperature: 0.2,
            });
            answer = response.choices[0].message.content || '';
        }
        else if (provider === 'openrouter') {
            if (!openrouter)
                throw new Error('OpenRouter client not initialized');
            const messages = [
                { role: 'system', content: systemInstruction },
                ...chatHistory.map((msg) => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content,
                })),
                { role: 'user', content: question },
            ];
            const response = await openrouter.chat.completions.create({
                model: process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.5-flash',
                messages,
                temperature: 0.2,
            });
            answer = response.choices[0].message.content || '';
        }
        else {
            // Default to Gemini
            if (!gemini)
                throw new Error('Gemini client not initialized');
            const modelName = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
            // Convert history to Gemini API format
            const contents = chatHistory.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            }));
            // Add current user question
            contents.push({
                role: 'user',
                parts: [{ text: question }],
            });
            const response = await gemini.models.generateContent({
                model: modelName,
                contents,
                config: {
                    systemInstruction,
                    temperature: 0.2,
                },
            });
            answer = response.text || '';
        }
        return {
            answer: answer.trim(),
            citations,
        };
    }
    catch (error) {
        console.error('LLM generation failed:', error);
        throw new Error(`LLM Query failed: ${error.message}`);
    }
};
exports.generateAnswerWithLLM = generateAnswerWithLLM;
