# 🩺 MedSynexa — Ultra-Fast AI Clinical Decision-Support Copilot for Indian OPDs

> **MedSynexa** is an ultra-fast (< 10s round-trip, < 1s with Cerebras), real-time AI reasoning and clinical decision layer engineered specifically for the extreme volume and time constraints of Indian Hospital Outpatient Departments (OPDs).

---

## 📌 Executive Summary & Problem Statement

### The Problem in Indian OPDs
* **Severe Time Constraints**: Indian hospital OPD doctors spend **less than 2 minutes per patient consultation** under extreme patient volume and physical fatigue.
* **Failure of Existing Tools**: Global clinical search tools (e.g. OpenEvidence, UpToDate, ChatGPT) fail in Indian OPDs because they require heavy reading, assume slow 15-minute US consultation workflows, and lack Indian pharmaceutical/guideline localization.
* **Diagnostic Risk**: High fatigue and memory reliance lead to missed differential diagnoses, unflagged drug-drug interactions, and non-compliance with national health standards.

### The MedSynexa Solution
MedSynexa provides a zero-friction point-of-care copilot. A doctor inputs a short, unstructured note (symptoms, vitals, age, brief history) via text or voice, and within seconds receives:
1. **Ranked Differential Diagnoses** (with likelihood percentages and ICD-10 codes).
2. **Localized Treatment Options** (ICMR/NHP aligned, using Indian brand names like Crocin, Augmentin, Azithral, generic formulations, and local dosage regimens).
3. **Real-Time Safety Flags** (allergy warnings, drug-drug interaction alerts, renal/hepatic dose tweaks).
4. **OCR Lab Report Pathology Analysis** (extracting blood parameters, highlighting abnormal values, and suggesting diagnostic next steps).

---

## 🏗️ High-Level System Architecture

```
                                  [ DOCTOR INTERFACE ]
                                (Next.js 15 + Tailwind)
                                           │
                                           ▼
                                [ NODE.JS EXPRESS API ]
                                (JWT Auth & Controllers)
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
[ PostgreSQL + pgvector ]        [ LangChain JS Engine ]             [ MongoDB Database ]
(768-dim Vector Embeddings)      (LCEL Chains & Zod Schemas)         (Users, Chats, Sessions)
         │                                 │                                 │
         └─────────────────────────────────┼─────────────────────────────────┘
                                           │
                                           ▼
                                 [ DUAL AI PROVIDERS ]
             ┌─────────────────────────────┴─────────────────────────────┐
             │                                                           │
             ▼                                                           ▼
 [ Cerebras Wafer-Scale Engine ]                             [ Google Gemini AI ]
 (Llama 3.1 70B @ 1800+ tokens/sec)                          (text-embedding-004 & Vision OCR)
```

---

## 🧠 Dual-AI Engine Architecture

| AI Component | Provider | Model | Purpose | Latency |
|---|---|---|---|---|
| **Clinical LLM Reasoning** | **Cerebras AI** | `llama3.1-70b` | Sub-second OPD differential reasoning, treatment options, safety flags | **< 0.5s** |
| **Fallback Clinical LLM** | **Google Gemini** | `gemini-2.5-flash` | Secondary reasoning provider for complex long-context analysis | **2 - 3s** |
| **Vector Embeddings** | **Google Gemini** | `text-embedding-004` | 768-dimensional embeddings for medical documents & lab report chunks | **< 100ms** |
| **Vision OCR** | **Google Gemini** | `gemini-2.5-flash` | Extracts full text from scanned lab report image files & photos | **1 - 2s** |

---

## 🔥 Key Core Features

### 1. 🩺 OPD Clinical Copilot (Sub-10-Second Reasoning)
* **Unstructured Note Parsing**: Extracts age, gender, duration, chief complaint, symptoms, vitals (BP, HR, Temp, SpO2, RBS), allergies, and history from messy doctor notes.
* **ICMR / NHP Alignment**: Treatment options recommend Indian generic formulations alongside widely available Indian brand names (Cipla, Sun Pharma, Abbott India, Mankind, etc.).
* **Safety Guardrails**: Automatically detects drug-drug interactions against current medications, allergy risks, and renal/hepatic contraindications.
* **Keyboard Shortcut**: `Ctrl+Enter` triggers instant synthesis for ultra-fast OPD throughput.

### 2. 🧪 OCR Lab Report Pathology Analyzer
* **Automated OCR Fallback**: Invokes Gemini Vision OCR whenever scanned image PDFs or blood report photos are uploaded.
* **`topK=12` pgvector Retrieval**: Extracts CBC, LFT, KFT, and Lipid Panel values into a structured table.
* **Color-Coded Status Badges**: Parameter values are categorized as `normal`, `abnormal_high`, `abnormal_low`, or `critical`.
* **Clinical Pathological Narrative**: Provides evidence-based clinical implications and recommended follow-up investigations.

### 3. 📚 Document & Vector Namespace Library
* **Separate Route**: Dedicated Document Library view (`/dashboard` -> `DocumentsList`).
* **Document Tagging**: Distinguishes between General Clinical Guidelines and Lab Report Scans.
* **File Streaming**: Stream uploaded PDFs directly in the browser via `/api/documents/:id/file`.
* **Full Cleanup**: Deleting a document removes local disk storage, MongoDB metadata, and pgvector embeddings.

---

## 🗄️ Database & Storage Architecture

### 1. PostgreSQL + `pgvector` (Vector Store)
Stores text chunk embeddings (768 dimensions) for fast cosine similarity search:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  filename    TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'general',
  chunk_index INTEGER NOT NULL,
  content     TEXT NOT NULL,
  embedding   vector(768) NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_embeddings_vector
  ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### 2. MongoDB Schemas
* `User`: Doctor authentication data, hashed passwords (`bcrypt`), first/last name.
* `RefreshToken`: Rotated JWT refresh tokens for secure session persistence.
* `Document`: Document metadata, original filename, local disk path, file size, chunk count, and `documentType`.
* `Chat`: Multi-turn Q&A sessions linked to indexed documents.
* `ClinicalSession`: OPD consultation history audit trail storing inputs and structured AI decision outputs.
* `ReportAnalysis`: Cached lab pathology report analysis results.

---

## 📡 API Endpoints Specification

### Authentication
* `POST /api/auth/register` — Create doctor account
* `POST /api/auth/login` — Authenticate & receive access/refresh JWTs
* `POST /api/auth/refresh` — Rotate access token
* `POST /api/auth/logout` — Revoke refresh token

### OPD Clinical Decision Support
* `POST /api/clinical/analyze` — Run instant OPD clinical reasoning
* `GET /api/clinical/history` — Fetch doctor's past OPD consultation history
* `GET /api/clinical/session/:id` — Fetch specific clinical session details

### OCR Lab Report Analysis
* `POST /api/reports/analyze/:documentId` — Run OCR + pgvector RAG analysis on a lab report
* `GET /api/reports/analysis/:documentId` — Get cached report analysis
* `GET /api/reports/analyses` — List all analyzed lab reports

### Document & Vector Management
* `POST /api/documents/upload` — Upload PDF/DOCX/image document
* `GET /api/documents` — List all uploaded documents (optional `?type=` filter)
* `GET /api/documents/:id/file` — Stream original document file
* `PUT /api/documents/:id/rename` — Rename document
* `DELETE /api/documents/:id` — Delete file from disk, MongoDB, and pgvector

---

## 🛠️ Step-by-Step Local Setup Guide

### 1. Prerequisites
- Node.js v18+ & npm
- MongoDB (running locally or MongoDB Atlas URI)
- PostgreSQL (with `pgvector` extension)

### 2. Configure Environment Variables
Create a `.env` file inside the `backend` directory:

```env
# Server Config
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Databases
MONGODB_URI=mongodb://localhost:27017/medsynexa_db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medsynexa

# JWT Configuration
JWT_ACCESS_SECRET=medsynexa_access_secret_12345
JWT_REFRESH_SECRET=medsynexa_refresh_secret_12345

# ⚡ Cerebras AI — Sub-Second Inference (Optional)
LLM_PROVIDER=cerebras
CEREBRAS_API_KEY=your_cerebras_api_key_here
CEREBRAS_MODEL=llama3.1-70b

# 🧠 Google Gemini AI — Embeddings & Vision OCR
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_CHAT_MODEL=gemini-2.5-flash

# Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=20
```

### 3. Start PostgreSQL with `pgvector` (Docker)
```bash
docker run -d --name pgvector -p 5432:5432 -e POSTGRES_PASSWORD=postgres pgvector/pgvector:pg16
```

### 4. Run the Project
```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## 🥊 Competitive Advantage: MedSynexa vs. Global Tools

| Feature | OpenEvidence / UpToDate | Generic ChatGPT | MedSynexa |
|---|---|---|---|
| **OPD Latency** | 15–30 seconds | 5–10 seconds | **< 10s (Sub-second with Cerebras)** |
| **Indian Drug Localization** | ❌ US Brand names | ❌ Generic text | **✅ Indian Brand & Generic names** |
| **ICMR / NHP Compliance** | ❌ US Guidelines | ❌ Uncontrolled | **✅ Aligned with Indian Health Portal** |
| **OCR Lab Report RAG** | ❌ Not available | ❌ Manual text copy | **✅ Automated Vision OCR + pgvector** |
| **Zero Reading Friction** | ❌ Multi-page papers | ❌ Long essays | **✅ Decision Matrix Cards & Rx output** |
| **Vector DB Cost** | Paid Enterprise | N/A | **✅ 100% Free PostgreSQL + pgvector** |

---

## 📄 License
MedSynexa is open-source under the MIT License. Developed for Indian Healthcare Systems.
