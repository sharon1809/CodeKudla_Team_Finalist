import { Schema, model } from 'mongoose';
import { IRefreshToken } from '../types';

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
