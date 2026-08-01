import { Schema, model } from 'mongoose';
import { IPatientReport } from '../types';

const patientReportSchema = new Schema<IPatientReport>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    causes: {
      type: String,
      required: true,
    },
    cures: {
      type: String,
      required: true,
    },
    dietAndLifestyle: {
      type: String,
      required: true,
    },
    simpleSummary: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

patientReportSchema.index({ patientId: 1, createdAt: -1 });
patientReportSchema.index({ doctorId: 1, createdAt: -1 });

export const PatientReport = model<IPatientReport>('PatientReport', patientReportSchema);
