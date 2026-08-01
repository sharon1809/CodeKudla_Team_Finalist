import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';

export class OpenRouterEmbeddings extends Embeddings {
  apiKey: string;
  modelName: string;

  constructor(fields: { apiKey: string; modelName?: string } & EmbeddingsParams) {
    super(fields ?? {});
    this.apiKey = fields.apiKey;
    this.modelName = fields.modelName || 'nvidia/nemotron-3-embed-1b:free';
  }

  private async _embed(input: string | string[]): Promise<number[][]> {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
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
    const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here';

    if (provider === 'gemini' && hasGeminiKey) {
      embeddingModel = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
      });
      console.log('🧠 Initialized Google Gemini Embeddings (text-embedding-004)');
    } else if (hasOpenRouterKey) {
      embeddingModel = new OpenRouterEmbeddings({
        apiKey: process.env.OPENROUTER_API_KEY as string,
        modelName: process.env.OPENROUTER_EMBEDDING_MODEL || 'nvidia/nemotron-3-embed-1b:free',
      });
      console.log('🧠 Initialized OpenRouter Embeddings');
    } else if (hasGeminiKey) {
      embeddingModel = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
      });
      console.log('🧠 Initialized Google Gemini Embeddings (fallback)');
    } else {
      throw new Error('No valid API key configured for embeddings (neither OPENROUTER_API_KEY nor GEMINI_API_KEY was found).');
    }
  }
  return embeddingModel;
};

export const getLLMModel = (temperature = 0.2): any => {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  const hasCerebrasKey = !!process.env.CEREBRAS_API_KEY && process.env.CEREBRAS_API_KEY !== 'your_cerebras_api_key_here';
  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here';

  if (provider === 'openrouter' && hasOpenRouterKey) {
    return new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
      model: process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.5-flash',
      temperature,
      maxRetries: 0,
    });
  }

  if (provider === 'cerebras' && hasCerebrasKey) {
    return new ChatOpenAI({
      apiKey: process.env.CEREBRAS_API_KEY || '',
      configuration: {
        baseURL: 'https://api.cerebras.ai/v1',
      },
      model: process.env.CEREBRAS_MODEL || 'llama3.1-70b',
      temperature,
      maxRetries: 0,
    });
  }

  if (hasOpenRouterKey) {
    return new ChatOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
      model: process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.5-flash',
      temperature,
      maxRetries: 0,
    });
  }

  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
    temperature,
    maxRetries: 0,
  });
};
