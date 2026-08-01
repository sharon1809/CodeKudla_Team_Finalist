import { Request, Response } from 'express';
import { XrayStudy, XrayImage, AIReport, FinalReport } from '../models/Xray';
import { analyzeXrayWithGemini, generateDraftReportText } from '../services/xrayService';
import { generateAndUploadReportPDF } from '../services/pdfService';
import { sendSMS } from '../services/smsService';
import { saveUploadedFile, downloadAndDecompressFile } from '../services/storageService';
import { Types } from 'mongoose';
import { Patient } from '../models/Patient';
import { User } from '../models/User';

export const uploadXray = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, studyType, view } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No image provided' });
      return;
    }

    // Determine technician ID from auth
    const technicianId = req.user?.id;

    // Handle invalid patientId (e.g. user types "1" in the UI)
    let actualPatientId = patientId;
    if (!Types.ObjectId.isValid(patientId)) {
      const firstPatient = await Patient.findOne();
      if (!firstPatient) {
        res.status(400).json({ error: 'Invalid Patient ID format and no default patients exist in DB.' });
        return;
      }
      actualPatientId = firstPatient._id;
    }

    // 1. Analyze with Gemini Vision (Read local file before it gets deleted)
    const aiResult = await analyzeXrayWithGemini(file.path, studyType, file.mimetype);
    const draftText = generateDraftReportText(aiResult);

    // 2. Save uploaded file to Storage (This deletes the local temp file)
    const imagePath = await saveUploadedFile(file.path, file.originalname, actualPatientId.toString());

    // 3. Create XrayStudy in DB
    const study = await XrayStudy.create({
      patientId: actualPatientId,
      technicianId,
      studyType,
      status: 'draft',
    });

    // 4. Create XrayImage
    await XrayImage.create({
      studyId: study._id,
      imageUrl: imagePath,
      view,
    });

    // 5. Save AI Report to DB

    await AIReport.create({
      studyId: study._id,
      rawJson: JSON.stringify(aiResult),
      generatedReport: draftText,
      confidence: aiResult.confidence,
      model: 'gemini-2.5-flash',
    });

    res.status(201).json({
      message: 'X-ray uploaded and analyzed successfully',
      studyId: study._id,
      aiResult,
      draftText
    });
  } catch (error: any) {
    console.error('uploadXray error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload and analyze X-ray' });
  }
};

export const getStudies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const studies = await XrayStudy.find(filter)
      .populate('patientId', 'name age gender contactNumber')
      .populate('technicianId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json(studies);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch studies' });
  }
};

export const getStudyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const study = await XrayStudy.findById(id)
      .populate('patientId', 'name age gender contactNumber')
      .populate('technicianId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName');

    if (!study) {
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    const image = await XrayImage.findOne({ studyId: id });
    const aiReport = await AIReport.findOne({ studyId: id });
    const finalReport = await FinalReport.findOne({ studyId: id });

    res.status(200).json({ study, image, aiReport, finalReport });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch study details' });
  }
};

export const techSubmit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { editedReport } = req.body;

    const study = await XrayStudy.findById(id);
    if (!study) {
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    // Update AIReport with Technician's edits
    if (editedReport) {
      await AIReport.findOneAndUpdate({ studyId: id }, { generatedReport: editedReport });
    }

    study.status = 'tech_submitted';
    await study.save();

    res.status(200).json({ message: 'Study submitted to doctor for review', study });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit study' });
  }
};

export const doctorApprove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { finalReportText } = req.body;
    const doctorId = req.user?.id;

    const study = await XrayStudy.findById(id).populate('patientId');
    if (!study) {
      res.status(404).json({ error: 'Study not found' });
      return;
    }

    const patient: any = study.patientId;

    // Generate PDF
    const doctor = await User.findById(doctorId);
    const docName = doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Doctor';
    
    const pdfUrl = await generateAndUploadReportPDF(
      finalReportText,
      study.studyType,
      patient.name,
      docName,
      patient._id.toString()
    );

    // Save Final Report
    const finalReport = await FinalReport.create({
      studyId: id,
      approvedByDoctor: doctorId,
      pdfUrl: pdfUrl,
    });

    study.status = 'approved';
    study.doctorId = new Types.ObjectId(doctorId);
    await study.save();

    // Send SMS
    if (patient.contactNumber) {
      const smsMessage = `Your X-ray report is ready. Download it securely using the following link: ${pdfUrl}`;
      await sendSMS(patient.contactNumber, smsMessage);
    }

    res.status(200).json({ message: 'Report approved, PDF generated, and SMS sent.', finalReport });
  } catch (error: any) {
    console.error('doctorApprove error:', error);
    res.status(500).json({ error: 'Failed to approve report' });
  }
};

export const getXrayImageFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const image = await XrayImage.findOne({ studyId: id });

    if (!image) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    try {
      const uncompressedBuffer = await downloadAndDecompressFile(image.imageUrl);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `inline; filename="xray.jpg"`);
      res.send(uncompressedBuffer);
    } catch (err: any) {
      res.status(404).json({ error: 'Image file not found in storage' });
      return;
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Error serving image file' });
  }
};
