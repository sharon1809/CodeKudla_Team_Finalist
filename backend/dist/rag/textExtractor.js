"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromFile = exports.extractTextFromDocx = exports.extractTextFromPdf = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
/**
 * Extract raw text from a PDF file
 */
const extractTextFromPdf = async (filePath) => {
    try {
        const dataBuffer = fs_1.default.readFileSync(filePath);
        const data = await (0, pdf_parse_1.default)(dataBuffer);
        return data.text;
    }
    catch (error) {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};
exports.extractTextFromPdf = extractTextFromPdf;
/**
 * Extract raw text from a Word document (.docx)
 */
const extractTextFromDocx = async (filePath) => {
    try {
        const result = await mammoth_1.default.extractRawText({ path: filePath });
        return result.value;
    }
    catch (error) {
        throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
};
exports.extractTextFromDocx = extractTextFromDocx;
/**
 * Extract text depending on file extension
 */
const extractTextFromFile = async (filePath, extension) => {
    const ext = extension.toLowerCase().replace(/^\./, '');
    if (ext === 'pdf') {
        return (0, exports.extractTextFromPdf)(filePath);
    }
    else if (ext === 'docx') {
        return (0, exports.extractTextFromDocx)(filePath);
    }
    else {
        throw new Error(`Unsupported file type: ${extension}`);
    }
};
exports.extractTextFromFile = extractTextFromFile;
