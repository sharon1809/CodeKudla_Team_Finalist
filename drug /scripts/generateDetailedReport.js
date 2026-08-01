import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import aiService from '../src/services/AIService.js';

dotenv.config();

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/generateDetailedReport.js <response-json-file>');
  process.exit(1);
}

const result = JSON.parse(readFileSync(file, 'utf8'));

const report = await aiService.generateDetailedReport(result);
console.log(report);
