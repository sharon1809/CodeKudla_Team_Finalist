import { Schema, model } from 'mongoose';
import { IDocument } from '../types';

const documentSchema = new Schema<IDocument>(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    localPath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: 'application/pdf',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    documentType: {
      type: String,
      enum: ['general', 'lab_report', 'textbook'],
      default: 'general',
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'ready', 'failed'],
      default: 'pending',
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast user+type queries
documentSchema.index({ owner: 1, documentType: 1 });
documentSchema.index({ owner: 1, createdAt: -1 });

export const Document = model<IDocument>('Document', documentSchema);
