import { Schema, model } from 'mongoose';
import { IReportAnalysis } from '../types';

const labFindingSchema = new Schema({
  parameter: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, default: '' },
  referenceRange: { type: String, default: '' },
  status: {
    type: String,
    enum: ['normal', 'abnormal_high', 'abnormal_low', 'critical'],
    required: true,
  },
}, { _id: false });

const reportAnalysisSchema = new Schema<IReportAnalysis>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    findings: [labFindingSchema],
    interpretation: { type: String, required: true },
    clinicalImplications: [String],
    suggestedFollowUp: [String],
    urgencyLevel: {
      type: String,
      enum: ['routine', 'urgent', 'critical'],
      default: 'routine',
    },
  },
  {
    timestamps: true,
  }
);

reportAnalysisSchema.index({ documentId: 1, userId: 1 });
reportAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const ReportAnalysis = model<IReportAnalysis>('ReportAnalysis', reportAnalysisSchema);
