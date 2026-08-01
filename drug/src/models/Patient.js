import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  allergies: [{ type: String }],
  currentMedications: [{
    drugName: String,
    dosage: String,
    frequency: String,
    startDate: Date
  }],
  medicalHistory: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Patient', patientSchema);
