import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { VectorMatch, IMessage, ICitation } from '../../types';
import { getLLMModel } from './config';

export const runDocumentChatChain = async (
  question: string,
  chatHistory: IMessage[],
  contextChunks: VectorMatch[]
): Promise<{ answer: string; citations: ICitation[] }> => {
  const llm = getLLMModel(0.2);

  let contextText = '';
  const citations: ICitation[] = [];

  contextChunks.forEach((match, index) => {
    contextText += `[Source ${index + 1}] (${match.filename}, chunk ${match.chunkIndex}):\n"${match.content}"\n\n`;
    citations.push({
      text: match.content,
      chunkIndex: match.chunkIndex,
      sourceName: match.filename,
      score: match.score,
    });
  });

  const historyText = chatHistory
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are an expert AI Document Analysis Assistant for MedSynexa. Answer questions using ONLY the provided source blocks below.

CONTEXT SOURCES:
${contextText || 'No relevant context found.'}

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}

INSTRUCTIONS:
- Answer using ONLY information from the context sources above.
- When citing a source, add [Source N] at the end of the relevant sentence.
- If the context doesn't contain sufficient information, state: "The document does not contain enough information to answer this question."
- Format your response in clean Markdown. Use bullet points, headers, or bold text for clarity.
- Be accurate, concise, and cite your sources.`;

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', '{question}'],
  ]);

  const chain: any = prompt.pipe(llm).pipe(new StringOutputParser());
  const answer = await chain.invoke({ question });

  return { answer: String(answer).trim(), citations };
};
