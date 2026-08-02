import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import * as fs from 'fs';
import { VectorMatch } from '../types';
import { executeWithFallback } from './apiKeyManager';

// Zod Schema for X-Ray Analysis
export const xrayAnalysisSchema = z.object({
  study: z.string().describe("The type of study, e.g. 'Chest X-ray'"),
  imageQuality: z.string().describe("The quality of the image for interpretation"),
  findings: z.array(z.string()).describe("List of findings in the X-ray"),
  impression: z.array(z.string()).describe("Overall impression based on the findings"),
  abnormalities: z.array(z.string()).describe("List of explicit abnormalities found, empty if none"),
  urgency: z.enum(["Low", "Medium", "High", "Critical"]).describe("Urgency level of the findings"),
  confidence: z.number().describe("Confidence score of the AI model between 0 and 1"),
});

export type XrayAnalysisData = z.infer<typeof xrayAnalysisSchema>;

/**
 * Analyzes an X-Ray image using Gemini Vision with automatic multi-key API fallback
 */
export const analyzeXrayWithGemini = async (
  filePath: string,
  studyType: string,
  modality: string = 'X-Ray',
  mimeType: string = 'image/jpeg'
): Promise<XrayAnalysisData> => {
  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString('base64');

  const message = {
    role: 'user' as const,
    content: [
      {
        type: 'text' as const,
        text: `You are an expert medical assistant specializing in ${modality}. Analyze this ${studyType} image/document.
Return a structured JSON output detailing the study, image/scan quality, specific findings, overall impression, any specific abnormalities, a clinical urgency rating, and your confidence score.`,
      },
      {
        type: 'media' as const,
        data: base64Data,
        mimeType: mimeType,
      },
    ],
  };

  return executeWithFallback('gemini', async (apiKey) => {
    const llm = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-2.5-flash',
      temperature: 0,
    });

    const structuredLlm = llm.withStructuredOutput(xrayAnalysisSchema);
    const response = await structuredLlm.invoke([message]);
    return response;
  });
};

/**
 * Converts structured JSON into a professional Draft Radiology Report string
 */
export const generateDraftReportText = (data: XrayAnalysisData, patientName: string = 'Patient'): string => {
  return `STUDY REPORT

Study
${data.study}

Image Quality
${data.imageQuality}

Findings
${data.findings.map(f => '- ' + f).join('\n')}

Impression
${data.impression.map(i => '- ' + i).join('\n')}

Abnormalities
${data.abnormalities.length > 0 ? data.abnormalities.map(a => '- ' + a).join('\n') : 'None noted.'}`;
};

/**
 * Generates a final professional report grounded in the textbook RAG context with multi-key API fallback
 */
export const generateGroundedReport = async (
  initialFindings: XrayAnalysisData,
  ragContext: VectorMatch[],
  modality: string
): Promise<string> => {
  const contextText = ragContext.length > 0 
    ? ragContext.map((c, i) => `[Source ${i + 1}] (${c.filename}):\n"${c.content}"`).join('\n\n')
    : 'No relevant textbook context found.';

  const prompt = `You are a Senior Consultant Medical Professional specializing in ${modality}.
  
Your task is to review the initial AI findings of a diagnostic study and synthesize them with established medical literature (provided below) to create a final, highly professional, standard, and medically accepted report.

INITIAL AI FINDINGS:
Study: ${initialFindings.study}
Findings: ${initialFindings.findings.join('; ')}
Impression: ${initialFindings.impression.join('; ')}
Abnormalities: ${initialFindings.abnormalities.join('; ')}
Urgency: ${initialFindings.urgency}

TEXTBOOK / GUIDELINE CONTEXT:
${contextText}

INSTRUCTIONS:
1. Write a professional medical report appropriate for a ${modality}.
2. Ensure the terminology is standard and professional.
3. If the Textbook Context provides relevant diagnostic criteria, next steps, or clinical correlations matching the findings, INCLUDE them and cite them as [Source N].
4. Format the report using clear headers (e.g., CLINICAL INDICATION, FINDINGS, IMPRESSION, RECOMMENDATIONS).
5. Output ONLY the raw report text in PLAIN TEXT format. DO NOT use Markdown formatting like **bold** or asterisks, as this will be displayed in a plain text editor. Do not wrap in JSON.`;

  return executeWithFallback('gemini', async (apiKey) => {
    const llm = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-2.5-flash',
      temperature: 0.2,
    });

    const response: any = await llm.invoke([
      { role: 'user', content: prompt }
    ]);

    const responseContent = typeof response.content === 'string' ? response.content : String(response.content);
    return responseContent.replace(/\*\*/g, '').replace(/__/g, '').replace(/#/g, '').trim();
  });
};
