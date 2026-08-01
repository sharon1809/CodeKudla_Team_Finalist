import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import * as fs from 'fs';

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
 * Analyzes an X-Ray image using Gemini Vision and returns structured JSON
 */
export const analyzeXrayWithGemini = async (
  filePath: string,
  studyType: string,
  mimeType: string = 'image/jpeg'
): Promise<XrayAnalysisData> => {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
    temperature: 0,
  });

  const structuredLlm = llm.withStructuredOutput(xrayAnalysisSchema);

  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString('base64');

  const message = {
    role: 'user' as const,
    content: [
      {
        type: 'text' as const,
        text: `You are an expert radiology assistant. Analyze this ${studyType} image.
Return a structured JSON output detailing the study, image quality, specific findings, overall impression, any specific abnormalities, a clinical urgency rating, and your confidence score.`,
      },
      {
        type: 'media' as const,
        data: base64Data,
        mimeType: mimeType,
      },
    ],
  };

  const response = await structuredLlm.invoke([message]);
  return response;
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
${data.abnormalities.length > 0 ? data.abnormalities.map(a => '- ' + a).join('\n') : 'None noted.'}

Urgency: ${data.urgency}
AI Confidence: ${(data.confidence * 100).toFixed(0)}%`;
};
