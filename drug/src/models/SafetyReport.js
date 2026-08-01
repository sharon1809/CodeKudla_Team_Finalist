import mongoose from 'mongoose';

const safetyReportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
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
  interactionReport: { type: mongoose.Schema.Types.Mixed, default: null },
  warnings: [String],
  contraindications: [String],
  report: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SafetyReport', safetyReportSchema);
