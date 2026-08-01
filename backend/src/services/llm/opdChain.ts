import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { VectorMatch, IPatientReportOutput } from '../../types';
import { getLLMModel } from './config';

const PatientReportOutputSchema = z.object({
  causes: z.string().describe('Explanation of why it happens and how it is caused, in simple terms'),
  cures: z.string().describe('Explanation of how it can be cured or managed, in simple terms'),
  dietAndLifestyle: z.string().describe('Recommendations for diet, exercise, and lifestyle improvements, in simple terms'),
  simpleSummary: z.string().describe('A very simple, compassionate summary for the patient (max 3 sentences)'),
});

export const runPatientReportChain = async (
  contextChunks: VectorMatch[],
  condition: string
): Promise<IPatientReportOutput> => {
  const llm = getLLMModel(0.2);
  const parser: any = (StructuredOutputParser as any).fromZodSchema(PatientReportOutputSchema);

  const contextText = contextChunks.map((c) => c.content).join('\n\n---\n\n');

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a compassionate, expert doctor explaining medical conditions to a patient.
      
You need to generate a patient-friendly report about the condition: "${condition}"

You MUST base your report STRICTLY on the following textbook extracts:

EXTRACTED TEXTBOOK CONTENT:
${contextText}

Your task:
1. Explain why it happens and how it is caused.
2. Explain how it can be cured or managed.
3. Suggest diet and lifestyle improvements to help.
4. Provide a simple, compassionate summary.

CRITICAL RULES:
- Use simple language (6th-grade reading level). Avoid complex medical jargon without explaining it.
- Speak directly and empathetically to the patient (e.g., "This happens when your body...").
- ONLY include information supported by the extracted textbook content provided.
- If the textbook content does not mention a cure or specific diet, state "Based on the reference, specific details on [topic] are not provided." Do NOT make things up.

{format_instructions}`,
    ],
    ['human', `Please generate the patient report for ${condition}.`],
  ]);

  const chain: any = prompt.pipe(llm).pipe(parser);
  const result = (await chain.invoke({
    format_instructions: parser.getFormatInstructions(),
  })) as IPatientReportOutput;

  return result;
};
