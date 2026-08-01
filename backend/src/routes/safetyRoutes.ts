import express from 'express';
import { Patient } from '../models/Patient';
import SafetyReport from '../models/SafetyReport';
import drugService from '../services/DrugService';
import aiService from '../services/AIService';

const router = express.Router();

// Get all safety reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await SafetyReport.find()
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a safety report by ID
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await SafetyReport.findById(req.params.id).select('-__v');
    if (!report) {
      return res.status(404).json({ error: 'Safety report not found' });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all safety reports for a patient
router.get('/reports/patient/:patientId', async (req, res) => {
  try {
    const reports = await SafetyReport.find({
      patientId: req.params.patientId
    }).sort({ createdAt: -1 }).select('-__v');
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check drug safety for a patient
router.post('/check', async (req, res) => {
  try {
    const { patientId, drugName, includeReport } = req.body;

    if (!patientId || !drugName) {
      return res.status(400).json({
        error: 'Missing required fields: patientId and drugName'
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const safetyCheck = await drugService.performSafetyCheck(patient, drugName);

    let report = null;
    if (includeReport) {
      report = await aiService.generateDetailedReport({
        patient,
        drug: {
          name: drugName,
          warnings: safetyCheck.drug.warnings,
          contraindications: safetyCheck.drug.contraindications
        },
        safetyCheck: {
          status: safetyCheck.status,
          message: safetyCheck.message,
          allergyCheck: safetyCheck.allergyCheck,
          interactionReport: safetyCheck.interactionReport
        }
      });
    }

    const response: any = {
      patient: {
        id: patient._id,
        name: patient.name
      },
      drug: {
        name: drugName,
        warnings: safetyCheck.drug.warnings,
        contraindications: safetyCheck.drug.contraindications
      },
      safetyCheck: {
        status: safetyCheck.status,
        message: safetyCheck.message,
        summary: safetyCheck.summary,
        recommendations: safetyCheck.recommendations,
        allergyCheck: safetyCheck.allergyCheck,
        interactionReport: safetyCheck.interactionReport
      },
      report
    };

    const savedReport = await SafetyReport.create({
      patientId: patient._id,
      patientName: patient.name,
      drugName,
      status: safetyCheck.status,
      message: safetyCheck.message,
      allergyCheck: safetyCheck.allergyCheck,
      interactionReport: safetyCheck.interactionReport,
      warnings: safetyCheck.drug.warnings,
      contraindications: safetyCheck.drug.contraindications,
      report
    });

    response.safetyReportId = savedReport._id;

    res.json(response);
  } catch (error: any) {
    console.error('Safety check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quick safety check (without saving patient)
router.post('/quick-check', async (req, res) => {
  try {
    const { patient, drugName } = req.body;

    if (!patient || !drugName) {
      return res.status(400).json({
        error: 'Missing required fields: patient and drugName'
      });
    }

    const safetyCheck = await drugService.performSafetyCheck(patient, drugName);

    const report = await aiService.generateDetailedReport({
      patient,
      drug: {
        name: drugName,
        warnings: safetyCheck.drug.warnings,
        contraindications: safetyCheck.drug.contraindications
      },
      safetyCheck: {
        status: safetyCheck.status,
        message: safetyCheck.message,
        allergyCheck: safetyCheck.allergyCheck,
        interactionReport: safetyCheck.interactionReport
      }
    });

    res.json({
      drug: {
        name: drugName,
        warnings: safetyCheck.drug.warnings,
        contraindications: safetyCheck.drug.contraindications
      },
      safetyCheck: {
        status: safetyCheck.status,
        message: safetyCheck.message,
        summary: safetyCheck.summary,
        recommendations: safetyCheck.recommendations,
        allergyCheck: safetyCheck.allergyCheck,
        interactionReport: safetyCheck.interactionReport
      },
      report
    });
  } catch (error: any) {
    console.error('Quick safety check error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
