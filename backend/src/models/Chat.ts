import { Schema, model } from 'mongoose';
import { IChat } from '../types';

const citationSchema = new Schema(
  {
    text: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    sourceName: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: [citationSchema],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const chatSchema = new Schema<IChat>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: false,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

export const Chat = model<IChat>('Chat', chatSchema);
