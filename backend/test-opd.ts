import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

async function runTest() {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medsynexa_db');
    console.log('✅ Connected to MongoDB for test');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Document = mongoose.model('Document', new mongoose.Schema({}, { strict: false }));

    const doctor: any = await User.findOne();
    if (!doctor) {
      console.error('❌ No doctors found in the database. Please register a user first.');
      process.exit(1);
    }
    console.log(`👨‍⚕️ Testing as Doctor: ${doctor.name || doctor.email} (ID: ${doctor._id})`);

    const token = jwt.sign(
      { id: doctor._id.toString(), email: doctor.email },
      process.env.JWT_ACCESS_SECRET || 'medsynexa_access_secret_2026',
      { expiresIn: '1h' }
    );

    const doc: any = await Document.findOne({ owner: doctor._id });
    if (!doc) {
      console.error('❌ No documents found for this doctor. Please upload a textbook first.');
      process.exit(1);
    }
    console.log(`📚 Using Textbook: ${doc.filename} (ID: ${doc._id})`);

    // 1. Create Patient
    console.log('\n🏥 1. Creating a new patient via API...');
    const createPatientRes = await fetch('http://localhost:5000/api/opd/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'John Doe Test',
        age: 45,
        gender: 'male',
        contactNumber: '1234567890',
        medicalHistory: 'None'
      })
    });

    const patientData: any = await createPatientRes.json();
    if (!createPatientRes.ok) throw new Error(patientData.message);
    const patientId = patientData.patient._id;
    console.log('✅ Patient created with ID:', patientId);

    // 2. Generate Patient Report using the Textbook
    console.log('\n⚙️ 2. Generating Patient Report from Textbook (This takes ~10-15 seconds)...');
    console.log('Condition: "Hypertension"');
    const generateRes = await fetch('http://localhost:5000/api/opd/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        documentId: doc._id.toString(),
        patientId: patientId,
        condition: 'Hypertension'
      })
    });

    const reportData: any = await generateRes.json();
    if (!generateRes.ok) throw new Error(reportData.message || JSON.stringify(reportData));

    console.log('\n🎉 REPORT GENERATED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('🩺 SIMPLE SUMMARY FOR PATIENT:');
    console.log(reportData.report.simpleSummary);
    console.log('\n🦠 CAUSES:');
    console.log(reportData.report.causes);
    console.log('\n💊 CURES & MANAGEMENT:');
    console.log(reportData.report.cures);
    console.log('\n🥗 DIET & LIFESTYLE:');
    console.log(reportData.report.dietAndLifestyle);
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest();
