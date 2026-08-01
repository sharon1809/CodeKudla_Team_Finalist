import { Request, Response } from 'express';
import { Document } from '../models/Document';
import { PatientReport } from '../models/PatientReport';
import { Patient } from '../models/Patient';
import { queryDocumentChunks } from '../services/pgvectorService';
import { getQueryEmbedding } from '../services/langchainService';
import { runPatientReportChain } from '../services/llm/opdChain';

/**
 * Generate a Patient Report based on a textbook and a specific condition
 */
export const generatePatientReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    const { documentId, patientId, condition } = req.body;

    if (!doctorId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!documentId || !patientId || !condition) {
      res.status(400).json({ message: 'documentId, patientId, and condition are required' });
      return;
    }

    // Check if textbook exists (unless it's a global search)
    let document = null;
    if (documentId !== 'all') {
      document = await Document.findOne({ _id: documentId, owner: doctorId });
      if (!document) {
        res.status(404).json({ message: 'Textbook not found or access denied.' });
        return;
      }
    }

    // Check if patient exists
    const patient = await Patient.findOne({ _id: patientId, doctorId });
    if (!patient) {
      res.status(404).json({ message: 'Patient not found or access denied.' });
      return;
    }

    console.log(`🩺 Generating Patient Report for condition: "${condition}" using textbook: ${documentId === 'all' ? 'All Textbooks' : document?.filename}`);

    // Generate query embedding focused on finding causes, cures, and lifestyle management for the condition
    const queryText = `causes, cures, treatment, management, diet, lifestyle for ${condition}`;
    const queryEmbedding = await getQueryEmbedding(queryText);

    // Retrieve chunks specifically from the single textbook (topK = 10 for comprehensive coverage)
    // If 'all', omit documentId filter
    const searchOptions: any = { queryText };
    if (documentId !== 'all') searchOptions.documentId = documentId;

    const matches = await queryDocumentChunks(doctorId, queryEmbedding, 15, searchOptions);

    if (!matches || matches.length === 0) {
      res.status(400).json({ message: 'No relevant information found in the specified textbook for this condition.' });
      return;
    }

    // Run LangChain Patient Report Chain
    const reportOutput = await runPatientReportChain(matches, condition);

    // Save the generated report
    const patientReport = new PatientReport({
      patientId,
      doctorId,
      documentId: documentId === 'all' ? null : documentId,
      condition,
      causes: reportOutput.causes,
      cures: reportOutput.cures,
      dietAndLifestyle: reportOutput.dietAndLifestyle,
      simpleSummary: reportOutput.simpleSummary,
    });
    
    await patientReport.save();

    res.status(201).json({
      message: 'Patient report generated successfully',
      report: patientReport,
    });
  } catch (error: any) {
    console.error('Error during patient report generation:', error);
    res.status(500).json({
      message: 'Failed to generate patient report. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Get all reports for a specific patient
 */
export const getPatientReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    const { patientId } = req.params;

    const reports = await PatientReport.find({ patientId, doctorId })
      .populate('documentId', 'filename')
      .sort({ createdAt: -1 });

    res.status(200).json({ reports });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving patient reports', error: error.message });
  }
};

/**
 * Get a specific patient report by ID
 */
export const getPatientReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    const { id } = req.params;

    const report = await PatientReport.findOne({ _id: id, doctorId })
      .populate('patientId', 'name age gender')
      .populate('documentId', 'filename');
      
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }

    res.status(200).json({ report });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving patient report', error: error.message });
  }
};

/**
 * Create a new patient
 */
export const createPatient = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    const { name, age, gender, contactNumber, medicalHistory } = req.body;

    if (!name || !age || !gender) {
      res.status(400).json({ message: 'Name, age, and gender are required' });
      return;
    }

    const patient = new Patient({
      name,
      age,
      gender,
      contactNumber,
      doctorId,
      medicalHistory,
    });

    await patient.save();

    res.status(201).json({ message: 'Patient created successfully', patient });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating patient', error: error.message });
  }
};

/**
 * Get all patients for the doctor
 */
export const getPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    const patients = await Patient.find({ doctorId }).sort({ createdAt: -1 });
    res.status(200).json({ patients });
  } catch (error: any) {
    res.status(500).json({ message: 'Error retrieving patients', error: error.message });
  }
};
