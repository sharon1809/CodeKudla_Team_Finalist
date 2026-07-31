import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { connectMongoDB, initPgVector, ensureUploadDir } from './config/database';
import app from './app';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);

async function bootstrap() {
  try {
    // Initialize storage directory
    ensureUploadDir();

    // Connect databases
    await connectMongoDB();
    await initPgVector();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n🚀 MedSynexa Backend running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      
      const hasOpenRouter = !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here';
      const llmText = hasOpenRouter 
        ? `OpenRouter (${process.env.OPENROUTER_CHAT_MODEL || 'google/gemini-2.5-flash'})` 
        : `Gemini (${process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash'})`;
      const embeddingText = hasOpenRouter 
        ? `OpenRouter (${process.env.OPENROUTER_EMBEDDING_MODEL || 'nvidia/nemotron-3-embed-1b:free'}) (2048-dim)` 
        : `Gemini (${process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'}) (768-dim)`;

      console.log(`   LLM Provider: ${llmText}`);
      console.log(`   Embedding: ${embeddingText}`);
      console.log(`   Vector DB: PostgreSQL + pgvector\n`);
    });
  } catch (error) {
    console.error('❌ Server bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
