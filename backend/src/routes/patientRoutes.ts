import express from 'express';
import { Patient } from '../models/Patient';
import SafetyReport from '../models/SafetyReport';
import { XrayStudy, XrayImage, AIReport } from '../models/Xray';
import { PatientReport } from '../models/PatientReport';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/timeline', authenticate, async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const [safetyReports, xrayStudies, patientReports] = await Promise.all([
      SafetyReport.find({ patientId }).sort({ createdAt: -1 }),
      XrayStudy.find({ patientId }).sort({ createdAt: -1 }),
      PatientReport.find({ patientId }).sort({ createdAt: -1 }),
    ]);

    const xrayDetails = await Promise.all(
      xrayStudies.map(async (study) => {
        const image = await XrayImage.findOne({ studyId: study._id });
        const aiReport = await AIReport.findOne({ studyId: study._id });
        return { study, image, aiReport };
      })
    );

    res.json({
      patient,
      safetyReports,
      xrayStudies: xrayDetails,
      patientReports,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      doctorId: req.user?.id // Set doctorId from the authenticated user
    };
    const patient = new Patient(patientData);
    await patient.save();
    res.status(201).json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json({ message: 'Patient deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
