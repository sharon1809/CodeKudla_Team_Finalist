import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { VectorMatch, IMessage, ICitation } from '../types';

// ─── Singleton Clients ────────────────────────────────────────────────────────
let embeddingModel: GoogleGenerativeAIEmbeddings | null = null;

const getEmbeddingModel = (): GoogleGenerativeAIEmbeddings => {
  if (!embeddingModel) {
    embeddingModel = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    });
  }
  return embeddingModel;
};

/**
 * Returns either Cerebras (if CEREBRAS_API_KEY is present or LLM_PROVIDER=cerebras)
 * or Gemini 2.5 Flash as the LLM provider.
 */
const getLLMModel = (temperature = 0.2): any => {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  const hasCerebrasKey = !!process.env.CEREBRAS_API_KEY;

  if (hasCerebrasKey || provider === 'cerebras') {
    return new ChatOpenAI({
      apiKey: process.env.CEREBRAS_API_KEY || '',
      configuration: {
        baseURL: 'https://api.cerebras.ai/v1',
      },
      model: process.env.CEREBRAS_MODEL || 'llama3.1-70b',
      temperature,
    });
  }

  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash',
    temperature,
  });
};

// ─── Embedding Functions ──────────────────────────────────────────────────────

export const getQueryEmbedding = async (text: string): Promise<number[]> => {
  const model = getEmbeddingModel();
  const embedding = await model.embedQuery(text);
  return embedding;
};

export const getBatchEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const model = getEmbeddingModel();
  const results: number[][] = [];
  const batchSize = 10;
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

// ─── Document Chat Chain ──────────────────────────────────────────────────────

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

// ─── Lab Report Analysis Chain ────────────────────────────────────────────────

const LabFindingSchema = z.object({
  parameter: z.string().describe('Lab test parameter name (e.g., Hemoglobin, Creatinine)'),
  value: z.string().describe('Measured value'),
  unit: z.string().describe('Unit of measurement (e.g., g/dL, mg/dL)'),
  referenceRange: z.string().describe('Normal reference range'),
  status: z.enum(['normal', 'abnormal_high', 'abnormal_low', 'critical']).describe('Status relative to reference range'),
});

const ReportAnalysisOutputSchema = z.object({
  findings: z.array(LabFindingSchema).describe('List of all lab parameters found in the report'),
  interpretation: z.string().describe('Overall narrative interpretation of the lab report in clinical language'),
  clinicalImplications: z.array(z.string()).describe('List of clinical implications based on findings'),
  suggestedFollowUp: z.array(z.string()).describe('Suggested follow-up investigations or actions'),
  urgencyLevel: z.enum(['routine', 'urgent', 'critical']).describe('Overall urgency based on findings'),
});

export type ReportAnalysisOutput = z.infer<typeof ReportAnalysisOutputSchema>;

export const runReportAnalysisChain = async (
  contextChunks: VectorMatch[],
  documentName: string
): Promise<ReportAnalysisOutput> => {
  const llm = getLLMModel(0.1);
  const parser: any = StructuredOutputParser.fromZodSchema(ReportAnalysisOutputSchema);

  const contextText = contextChunks.map((c) => c.content).join('\n\n---\n\n');

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert clinical pathologist and medical analyst specializing in Indian healthcare standards.
      
You are analyzing a lab report document: "${documentName}"

EXTRACTED REPORT CONTENT:
${contextText}

Your task:
1. Extract ALL lab parameters with their values, units, reference ranges, and normal/abnormal status
2. Provide a comprehensive clinical interpretation
3. List all clinical implications (what conditions these values might suggest)
4. Suggest specific follow-up investigations
5. Determine overall urgency level

Use Indian clinical reference ranges where applicable. Be thorough and accurate.

{format_instructions}`,
    ],
    ['human', 'Please analyze this lab report and provide structured findings.'],
  ]);

  const chain: any = prompt.pipe(llm).pipe(parser);
  const result = (await chain.invoke({
    format_instructions: parser.getFormatInstructions(),
  })) as ReportAnalysisOutput;

  return result;
};

// ─── Clinical Copilot Chain ───────────────────────────────────────────────────

const DifferentialDiagnosisSchema = z.object({
  condition: z.string().describe('Medical condition name'),
  likelihood: z.enum(['high', 'moderate', 'low']),
  likelihood_percentage: z.number().min(0).max(100).describe('Estimated likelihood percentage'),
  icdCode: z.string().optional().describe('ICD-10 code if applicable'),
  reasoning: z.string().describe('Clinical reasoning for this diagnosis'),
});

const TreatmentOptionSchema = z.object({
  drugName: z.string().describe('Generic drug name'),
  indianBrandNames: z.array(z.string()).describe('Common Indian brand names (e.g., Crocin, Cipla brand)'),
  dosage: z.string().describe('Recommended dosage'),
  frequency: z.string().describe('Dosing frequency'),
  duration: z.string().describe('Treatment duration'),
  route: z.string().describe('Route of administration'),
  contraindications: z.array(z.string()).describe('Key contraindications'),
  sideEffects: z.array(z.string()).describe('Common or important side effects'),
  notes: z.string().optional().describe('Additional clinical notes'),
});

const SafetyFlagSchema = z.object({
  type: z.enum(['drug_interaction', 'allergy', 'renal_caution', 'hepatic_caution', 'pregnancy', 'pediatric', 'elderly']),
  severity: z.enum(['critical', 'moderate', 'informational']),
  message: z.string().describe('Detailed safety message'),
  drugs: z.array(z.string()).optional().describe('Drugs involved in interaction if applicable'),
});

const ClinicalOutputSchema = z.object({
  differentialDiagnoses: z.array(DifferentialDiagnosisSchema).describe('Ranked differential diagnoses'),
  diagnosticNextSteps: z.array(z.string()).describe('Recommended investigations in priority order'),
  treatmentOptions: z.array(TreatmentOptionSchema).describe('Treatment options using Indian generic/brand names'),
  safetyFlags: z.array(SafetyFlagSchema).describe('Safety alerts, drug interactions, contraindications'),
  clinicalPearl: z.string().optional().describe('A useful clinical pearl for this case'),
  referralRecommended: z.boolean().describe('Whether specialist referral is recommended'),
  referralSpeciality: z.string().optional().describe('Which speciality to refer to if referral needed'),
});

export type ClinicalOutputType = z.infer<typeof ClinicalOutputSchema>;

export const runClinicalCopilotChain = async (input: {
  chiefComplaint: string;
  symptoms: string[];
  age: number;
  gender: string;
  vitals?: Record<string, any>;
  history?: string;
  allergies?: string[];
  currentMedications?: string[];
  duration?: string;
}): Promise<ClinicalOutputType> => {
  const llm = getLLMModel(0.15);
  const parser: any = StructuredOutputParser.fromZodSchema(ClinicalOutputSchema);

  const vitalsText = input.vitals
    ? Object.entries(input.vitals)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : 'Not provided';

  const symptomsText = input.symptoms?.length
    ? input.symptoms.join(', ')
    : 'Not specified';

  const allergiesText = input.allergies?.length
    ? input.allergies.join(', ')
    : 'None known';

  const currentMedsText = input.currentMedications?.length
    ? input.currentMedications.join(', ')
    : 'None';

  const systemPrompt = `You are MedSynexa, an expert AI clinical decision-support system designed for Indian Outpatient Departments (OPDs). You follow ICMR (Indian Council of Medical Research) and NHP (National Health Portal) guidelines.

PATIENT PRESENTATION:
- Age: ${input.age} years | Gender: ${input.gender}
- Chief Complaint: ${input.chiefComplaint}
- Symptoms: ${symptomsText}
- Duration: ${input.duration || 'Not specified'}
- Vitals: ${vitalsText}
- History: ${input.history || 'Not provided'}
- Known Allergies: ${allergiesText}
- Current Medications: ${currentMedsText}

YOUR ROLE:
1. Provide a RANKED differential diagnosis list (most likely first) with ICD-10 codes
2. Suggest specific diagnostic investigations in priority order
3. Recommend evidence-based treatment using:
   - Indian generic drug names (with common Indian brand names like Crocin, Azithral, Augmentin, etc.)
   - Appropriate dosages for Indian patient population
   - Duration aligned with Indian standard of care
4. Flag ALL safety concerns: drug interactions, allergy risks, renal/hepatic dosing needs, age-specific cautions
5. Add a clinical pearl if relevant

CRITICAL RULES:
- Use Indian pharmaceutical brands (Cipla, Sun Pharma, Abbott India, Mankind, etc.)
- Follow ICMR/NHP/Indian formulary guidelines
- Always check for drug-drug interactions given current medications
- Consider cost-effectiveness for Indian patients
- Flag renal/hepatic dose adjustments

{format_instructions}`;

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', 'Provide the clinical decision support for this patient presentation.'],
  ]);

  const chain: any = prompt.pipe(llm).pipe(parser);
  const result = (await chain.invoke({
    format_instructions: parser.getFormatInstructions(),
  })) as ClinicalOutputType;

  return result;
};

// ─── Gemini Vision OCR ────────────────────────────────────────────────────────

export const extractTextWithGeminiVision = async (
  filePath: string,
  mimeType: string = 'application/pdf'
): Promise<string> => {
  const fs = await import('fs');
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
    temperature: 0,
  });

  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString('base64');

  const message = {
    role: 'user' as const,
    content: [
      {
        type: 'media' as const,
        data: base64Data,
        mimeType: mimeType,
      },
      {
        type: 'text' as const,
        text: `Please extract ALL text from this document exactly as it appears. 
Include all lab values, measurements, dates, patient information (anonymized), headers, and any other text.
Preserve the structure as much as possible. Output ONLY the extracted text, nothing else.`,
      },
    ],
  };

  const response: any = await llm.invoke([message]);
  return typeof response.content === 'string' ? response.content : String(response.content);
};
