import { Request, Response } from 'express';
import { Document } from '../models/Document';
import { ReportAnalysis } from '../models/ReportAnalysis';
import { queryDocumentChunks } from '../services/pgvectorService';
import { getQueryEmbedding, runReportAnalysisChain } from '../services/langchainService';

/**
 * Analyze an uploaded Lab Report using OCR + pgvector RAG
 */
export const analyzeLabReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { documentId } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if document exists and belongs to user
    const document = await Document.findOne({ _id: documentId, owner: userId });
    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Check if an analysis already exists in DB
    const existingAnalysis = await ReportAnalysis.findOne({ documentId, userId });
    if (existingAnalysis) {
      res.status(200).json({
        analysis: existingAnalysis,
        cached: true,
      });
      return;
    }

    console.log(`🧪 Analyzing Lab Report document: ${document.filename} (${documentId})`);

    // Generate query embedding focused on lab report parameters
    const queryText = "lab test parameters, values, reference range, abnormal results, blood count, metabolic panel, liver function, renal function";
    const queryEmbedding = await getQueryEmbedding(queryText);

    // Retrieve more chunks (topK = 12) for comprehensive coverage of lab reports
    const matches = await queryDocumentChunks(userId, queryEmbedding, 12, {
      documentId,
    });

    if (!matches || matches.length === 0) {
      res.status(400).json({ message: 'No vector chunks found for this report document.' });
      return;
    }

    // Run LangChain Lab Report Analysis Chain
    const analysisOutput = await runReportAnalysisChain(matches, document.filename);

    // Save report analysis in MongoDB
    const reportAnalysis = new ReportAnalysis({
      documentId,
      userId,
      findings: analysisOutput.findings,
      interpretation: analysisOutput.interpretation,
      clinicalImplications: analysisOutput.clinicalImplications,
      suggestedFollowUp: analysisOutput.suggestedFollowUp,
      urgencyLevel: analysisOutput.urgencyLevel,
    });
    await reportAnalysis.save();

    res.status(201).json({
      analysis: reportAnalysis,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error during lab report analysis:', error);
    res.status(500).json({
      message: 'Failed to analyze lab report. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Get existing lab report analysis by document ID
 */
export const getLabReportAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { documentId } = req.params;

    const analysis = await ReportAnalysis.findOne({ documentId, userId });
    if (!analysis) {
      res.status(404).json({ message: 'No analysis found for this report document' });
      return;
    }

    res.status(200).json({ analysis });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving lab report analysis', error: error.message });
  }
};

/**
 * Get list of all lab report analyses for current user
 */
export const getAllReportAnalyses = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const analyses = await ReportAnalysis.find({ userId })
      .populate('documentId', 'filename uploadDate fileSize documentType')
      .sort({ createdAt: -1 });

    res.status(200).json({ analyses });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving report analyses list', error: error.message });
  }
};
