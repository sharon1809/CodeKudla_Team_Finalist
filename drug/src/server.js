import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import drugRoutes from './routes/drugRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import safetyRoutes from './routes/safetyRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/drugs', drugRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/safety', safetyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Drug Safety Checker is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
