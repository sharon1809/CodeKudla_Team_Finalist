import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { getOpenRouterApiKeys, getGeminiApiKeys, executeWithFallback } from '../apiKeyManager';

export class OpenRouterEmbeddings extends Embeddings {
  apiKey: string;
  modelName: string;

  constructor(fields: { apiKey?: string; modelName?: string } & EmbeddingsParams) {
    super(fields ?? {});
    const keys = getOpenRouterApiKeys();
    this.apiKey = fields.apiKey || keys[0] || '';
    this.modelName = fields.modelName || 'nvidia/nemotron-3-embed-1b:free';
  }

  private async _embedSingleKey(apiKey: string, input: string | string[]): Promise<number[][]> {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelName,
        input: input,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter Embeddings API error (${response.status}): ${errText}`);
    }

    const json = (await response.json()) as any;
    if (!json.data || json.data.length === 0) {
      throw new Error(`Unexpected OpenRouter response: ${JSON.stringify(json)}`);
    }

    const sortedData = [...json.data].sort((a, b) => a.index - b.index);
    return sortedData.map((d: any) => d.embedding);
  }

  private async _embed(input: string | string[]): Promise<number[][]> {
    return executeWithFallback('openrouter', (key) => this._embedSingleKey(key, input));
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    if (documents.length === 0) return [];
    return this._embed(documents);
  }

  async embedQuery(document: string): Promise<number[]> {
    const result = await this._embed(document);
    return result[0];
  }
}

let embeddingModel: any = null;

export const getEmbeddingModel = (): any => {
  if (!embeddingModel) {
    const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
    const openRouterKeys = getOpenRouterApiKeys();
    const geminiKeys = getGeminiApiKeys();

    if (provider === 'gemini' && geminiKeys.length > 0) {
      embeddingModel = new GoogleGenerativeAIEmbeddings({
        apiKey: geminiKeys[0],
        modelName: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
      });
      console.log(`🧠 Initialized Google Gemini Embeddings (${geminiKeys.length} API keys pooled)`);
    } else if (openRouterKeys.length > 0) {
      embeddingModel = new OpenRouterEmbeddings({
        apiKey: openRouterKeys[0],
        modelName: process.env.OPENROUTER_EMBEDDING_MODEL || 'nvidia/nemotron-3-embed-1b:free',
      });
      console.log(`🧠 Initialized OpenRouter Embeddings (${openRouterKeys.length} API keys pooled)`);
    } else if (geminiKeys.length > 0) {
      embeddingModel = new GoogleGenerativeAIEmbeddings({
        apiKey: geminiKeys[0],
        modelName: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
      });
      console.log(`🧠 Initialized Google Gemini Embeddings fallback (${geminiKeys.length} API keys pooled)`);
    } else {
      throw new Error('No valid API keys configured for embeddings (check OPENROUTER_API_KEYS or GEMINI_API_KEYS in .env).');
    }
  }
  return embeddingModel;
};

export const getLLMModel = (temperature = 0.2): any => {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  const openRouterKeys = getOpenRouterApiKeys();
  const geminiKeys = getGeminiApiKeys();

  if (provider === 'openrouter' && openRouterKeys.length > 0) {
    return new ChatOpenAI({
      apiKey: openRouterKeys[0],
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
      model: process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.5-flash',
      temperature,
      maxRetries: 0,
    });
  }

  if (openRouterKeys.length > 0) {
    return new ChatOpenAI({
      apiKey: openRouterKeys[0],
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
      model: process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.5-flash',
      temperature,
      maxRetries: 0,
    });
  }

  return new ChatGoogleGenerativeAI({
    apiKey: geminiKeys[0] || process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
    temperature,
    maxRetries: 0,
  });
};
