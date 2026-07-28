import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract raw text from a PDF file
 */
export const extractTextFromPdf = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

/**
 * Extract raw text from a Word document (.docx)
 */
export const extractTextFromDocx = async (filePath: string): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error: any) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
};

/**
 * Extract text depending on file extension
 */
export const extractTextFromFile = async (filePath: string, extension: string): Promise<string> => {
  const ext = extension.toLowerCase().replace(/^\./, '');
  if (ext === 'pdf') {
    return extractTextFromPdf(filePath);
  } else if (ext === 'docx') {
    return extractTextFromDocx(filePath);
  } else {
    throw new Error(`Unsupported file type: ${extension}`);
  }
};
