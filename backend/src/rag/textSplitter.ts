import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Clean raw text by normalizing whitespaces, removing null bytes and control characters
 */
export const cleanText = (text: string): string => {
  return text
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other unprintable control characters
    .replace(/\r\n/g, '\n') // Normalize Windows newlines
    .replace(/\n{3,}/g, '\n\n') // Remove excessive empty lines
    .replace(/[ \t]+/g, ' ') // Collapse multiple spaces or tabs
    .trim();
};

/**
 * Split text content into intelligent chunks with overlap and filter garbage chunks
 */
export const splitTextIntoChunks = async (
  text: string,
  chunkSize = 1000,
  chunkOverlap = 200
): Promise<{ text: string; index: number }[]> => {
  const cleaned = cleanText(text);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const docs = await splitter.createDocuments([cleaned]);

  // Filter out chunks that are too small or contain no letters (garbage data)
  const validDocs = docs.filter(doc => {
    const t = doc.pageContent;
    return t.length >= 50 && /[a-zA-Z]/.test(t);
  });

  return validDocs.map((doc, idx) => ({
    text: doc.pageContent,
    index: idx,
  }));
};
