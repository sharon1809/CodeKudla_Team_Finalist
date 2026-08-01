import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';//lite -parse can also be used (b)
import mammoth from 'mammoth';
import { extractTextWithGeminiVision } from '../services/langchainService';

// Minimum text length to consider extraction successful (< this = likely scanned)
const MIN_TEXT_LENGTH = 150;

/**
 * Extract text from a PDF file.
 * Falls back to Gemini Vision OCR if pdf-parse returns insufficient text.
 */
export const extractTextFromPdf = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text?.trim() || '';

    if (text.length >= MIN_TEXT_LENGTH) {
      console.log(`📄 PDF text extracted: ${text.length} chars`);
      return text;
    }

    // Text too short — likely a scanned/image-based PDF, use Gemini Vision OCR
    console.log(`🔍 PDF text insufficient (${text.length} chars). Falling back to Gemini Vision OCR...`);
    const ocrText = await extractTextWithGeminiVision(filePath, 'application/pdf');
    console.log(`✅ OCR extracted: ${ocrText.length} chars`);
    return ocrText;
  } catch (error: any) {
    console.error('PDF parsing failed, trying Gemini OCR:', error.message);
    // Try OCR even on parse failure
    try {
      return await extractTextWithGeminiVision(filePath, 'application/pdf');
    } catch (ocrError: any) {
      throw new Error(`Failed to extract text from PDF: ${ocrError.message}`);
    }
  }
};

/**
 * Extract raw text from a Word document (.docx).
 */
export const extractTextFromDocx = async (filePath: string): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value?.trim() || '';
  } catch (error: any) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
};

/**
 * Extract text from an image file (JPG, PNG, etc.) using Gemini Vision.
 */
export const extractTextFromImage = async (filePath: string, mimeType: string): Promise<string> => {
  console.log(`🔍 Extracting text from image using Gemini Vision: ${path.basename(filePath)}`);
  return extractTextWithGeminiVision(filePath, mimeType);
};

/**
 * Universal text extractor — dispatches based on file extension.
 */
export const extractTextFromFile = async (
  filePath: string,
  extension: string,
  mimeType?: string
): Promise<string> => {
  const ext = extension.toLowerCase().replace(/^\./, '');

  switch (ext) {
    case 'pdf':
      return extractTextFromPdf(filePath);
    case 'docx':
      return extractTextFromDocx(filePath);
    case 'jpg':
    case 'jpeg':
      return extractTextFromImage(filePath, mimeType || 'image/jpeg');
    case 'png':
      return extractTextFromImage(filePath, 'image/png');
    case 'tiff':
    case 'tif':
      return extractTextFromImage(filePath, 'image/tiff');
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
};
