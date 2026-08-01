import { Schema, model, Document as MongoDocument, Types } from 'mongoose';

// Types
export interface IXrayStudy extends MongoDocument {
  patientId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  technicianId?: Types.ObjectId;
  studyType: string;
  status: 'draft' | 'tech_submitted' | 'doc_reviewed' | 'approved';
  createdAt: Date;
  updatedAt: Date;
}

export interface IXrayImage extends MongoDocument {
  studyId: Types.ObjectId;
  imageUrl: string;
  view: string;
  uploadedAt: Date;
}

export interface IAIReport extends MongoDocument {
  studyId: Types.ObjectId;
  rawJson: string; // Storing the Zod validated JSON as string
  generatedReport: string;
  confidence: number;
  model: string;
  createdAt: Date;
}

export interface IFinalReport extends MongoDocument {
  studyId: Types.ObjectId;
  approvedByDoctor: Types.ObjectId;
  approvedAt: Date;
  pdfUrl: string;
  version: number;
}

// Schemas
const xrayStudySchema = new Schema<IXrayStudy>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User' },
    studyType: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['draft', 'tech_submitted', 'doc_reviewed', 'approved'],
      default: 'draft'
    },
  },
  { timestamps: true }
);

const xrayImageSchema = new Schema<IXrayImage>(
  {
    studyId: { type: Schema.Types.ObjectId, ref: 'XrayStudy', required: true },
    imageUrl: { type: String, required: true },
    view: { type: String, required: true },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } }
);

const aiReportSchema = new Schema<IAIReport>(
  {
    studyId: { type: Schema.Types.ObjectId, ref: 'XrayStudy', required: true },
    rawJson: { type: String, required: true },
    generatedReport: { type: String, required: true },
    confidence: { type: Number, required: true },
    model: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const finalReportSchema = new Schema<IFinalReport>(
  {
    studyId: { type: Schema.Types.ObjectId, ref: 'XrayStudy', required: true },
    approvedByDoctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String, required: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: false }
);

// Models
export const XrayStudy = model<IXrayStudy>('XrayStudy', xrayStudySchema);
export const XrayImage = model<IXrayImage>('XrayImage', xrayImageSchema);
export const AIReport = model<IAIReport>('AIReport', aiReportSchema);
export const FinalReport = model<IFinalReport>('FinalReport', finalReportSchema);
