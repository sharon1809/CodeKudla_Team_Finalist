import { Document as MongoDocument, Types } from 'mongoose';

export interface IUser extends MongoDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IRefreshToken extends MongoDocument {
  token: string;
  user: Types.ObjectId;
  expiresAt: Date;
}

export interface IDocument extends MongoDocument {
  filename: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  owner: Types.ObjectId;
  fileSize: number;
  chunkCount: number;
  uploadDate: Date;
}

export interface ICitation {
  text: string;
  chunkIndex: number;
  sourceName: string;
}

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: ICitation[];
  createdAt: Date;
}

export interface IChat extends MongoDocument {
  title: string;
  owner: Types.ObjectId;
  document: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
