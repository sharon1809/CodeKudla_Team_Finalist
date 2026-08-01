import mongoose from 'mongoose';

const drugSchema = new mongoose.Schema({
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

export default mongoose.model('Drug', drugSchema);
