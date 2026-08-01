import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

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
