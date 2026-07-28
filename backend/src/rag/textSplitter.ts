import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Clean raw text by normalizing whitespaces and newlines
 */
export const cleanText = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Remove excessive empty lines
    .replace(/[ \t]+/g, ' ') // Collapse multiple spaces or tabs
    .trim();
};

/**
 * Split text content into intelligent chunks with overlap
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

  return docs.map((doc, idx) => ({
    text: doc.pageContent,
    index: idx,
  }));
};
