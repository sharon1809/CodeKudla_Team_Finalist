import { Schema, model } from 'mongoose';
import { IDocument } from '../types';

const documentSchema = new Schema<IDocument>(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileSize: {
      type: Number,
      required: true, // in bytes
    },
    chunkCount: {
      type: Number,
      default: 0,
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

export const Document = model<IDocument>('Document', documentSchema);
