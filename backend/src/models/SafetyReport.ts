import mongoose, { Document, Schema } from 'mongoose';

export interface ISafetyReport extends Document {
  patientId?: mongoose.Types.ObjectId;
  patientName?: string;
  drugName?: string;
  status?: 'SAFE' | 'WARNING' | 'BLOCKED';
  message?: string;
  allergyCheck?: string;
  interactions?: {
    drugName?: string;
    severity?: 'Mild' | 'Moderate' | 'Severe';
    description?: string;
  }[];
  interactionReport?: any;
  warnings?: string[];
  contraindications?: string[];
  report?: string;
  createdAt?: Date;
}

const safetyReportSchema = new Schema<ISafetyReport>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  patientName: String,
  drugName: String,
  status: { type: String, enum: ['SAFE', 'WARNING', 'BLOCKED'] },
  message: String,
  allergyCheck: String,
  interactions: [{
    drugName: String,
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
    description: String
  }],
  interactionReport: { type: Schema.Types.Mixed, default: null },
  warnings: [String],
  contraindications: [String],
  report: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.SafetyReport || mongoose.model<ISafetyReport>('SafetyReport', safetyReportSchema);
