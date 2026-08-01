import { Request, Response } from 'express';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

export const transcribeAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No audio file uploaded.' });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ message: 'GROQ_API_KEY is not configured on the server.' });
      return;
    }

    const filePath = req.file.path;
    
    // Use form-data to prepare the payload for Groq Whisper API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), req.file.originalname || 'audio.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'en'); 
    formData.append('response_format', 'json');
    formData.append('prompt', 'MedSynexa clinical consultation. Dolo 650, Crocin, Paracetamol, CBC, LFT, ECG, MRI, Dengue NS1, Auscultation, PRN, SOS, TDS, BD, OD. Severe headache, hypertension, tachycardia, bradycardia, arthritis, ibuprofen, omeprazole. Indian generic drugs.');

    const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // Cleanup the uploaded audio file to prevent disk fill-up
    fs.unlinkSync(filePath);

    res.status(200).json({ text: response.data.text });
  } catch (error: any) {
    console.error('Whisper Transcription Error:', error.response?.data || error.message);
    
    // Cleanup on error too
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Failed to transcribe audio.',
      error: error.response?.data || error.message 
    });
  }
};
