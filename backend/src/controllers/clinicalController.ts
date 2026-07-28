import { Request, Response } from 'express';
import { ClinicalSession } from '../models/ClinicalSession';
import { runClinicalCopilotChain } from '../services/langchainService';
import { IClinicalInput, IClinicalOutput } from '../types';

/**
 * Process a real-time clinical decision support query from an OPD doctor note.
 * Target Latency: < 10 seconds (typically 2-4s with Gemini / Cerebras).
 */
export const analyzeClinicalCase = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const {
      chiefComplaint,
      symptoms = [],
      age,
      gender,
      vitals,
      history,
      allergies = [],
      currentMedications = [],
      duration,
    } = req.body;

    if (!chiefComplaint || !age || !gender) {
      res.status(400).json({
        message: 'Chief complaint, patient age, and gender are required.',
      });
      return;
    }

    const clinicalInput: IClinicalInput = {
      chiefComplaint: chiefComplaint.trim(),
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      age: Number(age),
      gender: gender.toLowerCase() as 'male' | 'female' | 'other',
      vitals: vitals || {},
      history: history || '',
      allergies: Array.isArray(allergies) ? allergies : [],
      currentMedications: Array.isArray(currentMedications) ? currentMedications : [],
      duration: duration || '',
    };

    console.log(`🩺 Running Clinical Copilot for ${clinicalInput.age}yo ${clinicalInput.gender} with CC: "${clinicalInput.chiefComplaint}"`);

    // Execute LangChain Clinical Reasoning Chain with Zod structured output validation
    const rawOutput = await runClinicalCopilotChain(clinicalInput);

    const responseTimeMs = Date.now() - startTime;
    const clinicalOutput: IClinicalOutput = {
      ...rawOutput,
      responseTimeMs,
    };

    console.log(`✅ Clinical decision support generated in ${responseTimeMs}ms`);

    // Save session to MongoDB for auditing & history
    const session = new ClinicalSession({
      userId,
      input: clinicalInput,
      output: clinicalOutput,
    });
    await session.save();

    res.status(200).json({
      sessionId: session._id,
      input: clinicalInput,
      output: clinicalOutput,
      responseTimeMs,
    });
  } catch (error: any) {
    console.error('Error during clinical case analysis:', error);
    res.status(500).json({
      message: 'Failed to analyze clinical case. Please verify inputs.',
      error: error.message,
    });
  }
};

/**
 * Retrieve past clinical session history for current doctor
 */
export const getClinicalHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const sessions = await ClinicalSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ sessions });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving clinical history', error: error.message });
  }
};

/**
 * Get a specific clinical session by ID
 */
export const getClinicalSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const session = await ClinicalSession.findOne({ _id: id, userId });
    if (!session) {
      res.status(404).json({ message: 'Clinical session not found' });
      return;
    }

    res.status(200).json({ session });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving session details', error: error.message });
  }
};

/**
 * Delete a clinical session record
 */
export const deleteClinicalSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const result = await ClinicalSession.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.status(200).json({ message: 'Clinical session deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
};
