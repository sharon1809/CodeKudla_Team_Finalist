import { getEmbeddingModel } from './config';

export const getQueryEmbedding = async (text: string): Promise<number[]> => {
  const model = getEmbeddingModel();
  const embedding = await model.embedQuery(text);
  return embedding;
};

export const getBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const model = getEmbeddingModel();
  const results: number[][] = [];
  const batchSize = 100;
  const delayMs = 200;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await model.embedDocuments(batch);
    results.push(...batchEmbeddings);

    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
};
