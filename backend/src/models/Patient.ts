import { Schema, model } from 'mongoose';
import { IPatient } from '../types';

const patientSchema = new Schema<IPatient>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicalHistory: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ doctorId: 1, name: 1 });

export const Patient = model<IPatient>('Patient', patientSchema);
