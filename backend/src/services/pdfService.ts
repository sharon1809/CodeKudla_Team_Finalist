import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { saveUploadedFile, getFileUrl, cleanupTempFile } from './storageService';

/**
 * Generates a PDF for the Final Report, uploads it to storage, and returns the public/secure URL.
 */
export const generateAndUploadReportPDF = async (
  reportText: string,
  studyType: string,
  patientName: string,
  doctorName: string,
  patientId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const tempFileName = `report-${uuidv4()}.pdf`;
    const tempDir = path.join(process.cwd(), 'temp');
    const tempFilePath = path.join(tempDir, tempFileName);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(tempFilePath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).text('MEDSYNEXA HOSPITAL', { align: 'center' });
    doc.fontSize(10).text('123 Health Ave, Medical City, IN', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Patient & Study Details
    doc.fontSize(12).font('Helvetica-Bold').text('RADIOLOGY REPORT');
    doc.moveDown();
    doc.font('Helvetica').fontSize(10);
    doc.text(`Patient Name: ${patientName}`);
    doc.text(`Study Type: ${studyType}`);
    doc.text(`Date of Approval: ${new Date().toDateString()}`);
    doc.text(`Reporting Doctor: Dr. ${doctorName}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Report Content
    doc.fontSize(11).font('Helvetica');
    doc.text(reportText, { align: 'left', lineGap: 4 });

    doc.end();

    writeStream.on('finish', async () => {
      try {
        // Upload the generated PDF using the existing storage service
        // saveUploadedFile requires a temp path and originalName. 
        // We pass the pdf path and use patientId or doctorId for storage folder.
        const supabasePath = await saveUploadedFile(tempFilePath, tempFileName, patientId);
        
        // Get the downloadable URL
        const fileUrl = await getFileUrl(supabasePath);
        
        resolve(fileUrl);
      } catch (error) {
        reject(error);
      } finally {
        cleanupTempFile(tempFilePath);
      }
    });

    writeStream.on('error', (error) => {
      cleanupTempFile(tempFilePath);
      reject(error);
    });
  });
};
