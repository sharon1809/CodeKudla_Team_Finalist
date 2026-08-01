import mongoose, { Document, Schema } from 'mongoose';

export interface IDrug extends Document {
  name: string;
  setid?: string;
  warnings?: string[];
  contraindications?: string[];
  sideEffects?: string[];
  interactions?: {
    drugName?: string;
    severity?: 'Mild' | 'Moderate' | 'Severe';
    description?: string;
  }[];
  lastUpdated?: Date;
}

const drugSchema = new Schema<IDrug>({
  name: { type: String, required: true, unique: true },
  setid: String,
  warnings: [String],
  contraindications: [String],
  sideEffects: [String],
  interactions: [{
    drugName: String,
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe'] },
    description: String
  }],
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.models.Drug || mongoose.model<IDrug>('Drug', drugSchema);
