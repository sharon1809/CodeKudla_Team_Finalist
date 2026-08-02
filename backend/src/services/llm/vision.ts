import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { executeWithFallback } from '../apiKeyManager';

export const extractTextWithGeminiVision = async (
  filePath: string,
  mimeType: string = 'application/pdf'
): Promise<string> => {
  const fs = await import('fs');
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

  return executeWithFallback('gemini', async (apiKey) => {
    const llm = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-2.5-flash',
      temperature: 0,
    });

    const response: any = await llm.invoke([message]);
    return typeof response.content === 'string' ? response.content : String(response.content);
  });
};
