import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Patient } from '../src/models/Patient';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

const addWeights = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const patients = await Patient.find();
    console.log(`Found ${patients.length} patients.`);

    for (const patient of patients) {
      if (!patient.weight) {
        // Generate random weight between 50 and 100 kg
        const randomWeight = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
        await Patient.collection.updateOne(
          { _id: patient._id },
          { $set: { weight: randomWeight } }
        );
        console.log(`Updated patient ${patient.name} with weight ${randomWeight} kg`);
      }
    }

    console.log('Finished updating patients.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating patients:', error);
    process.exit(1);
  }
};

addWeights();
