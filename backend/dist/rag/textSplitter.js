"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitTextIntoChunks = exports.cleanText = void 0;
const textsplitters_1 = require("@langchain/textsplitters");
/**
 * Clean raw text by normalizing whitespaces and newlines
 */
const cleanText = (text) => {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n') // Remove excessive empty lines
        .replace(/[ \t]+/g, ' ') // Collapse multiple spaces or tabs
        .trim();
};
exports.cleanText = cleanText;
/**
 * Split text content into intelligent chunks with overlap
 */
const splitTextIntoChunks = async (text, chunkSize = 1000, chunkOverlap = 200) => {
    const cleaned = (0, exports.cleanText)(text);
    const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });
    const docs = await splitter.createDocuments([cleaned]);
    return docs.map((doc, idx) => ({
        text: doc.pageContent,
        index: idx,
    }));
};
exports.splitTextIntoChunks = splitTextIntoChunks;
