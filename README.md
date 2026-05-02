# Mentora 🎓

> AI-powered university information assistant for Gautam Buddha University — ask anything about courses, hostels, exams, clubs, fees, and more.

Mentora is a **RAG (Retrieval-Augmented Generation)** system that ingests university notices, PDFs, and documents, then answers student queries in natural language with **Hindi + English (multilingual)** support. It combines a FastAPI microservice backend with a React frontend chat interface.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Server Setup](#server-setup)
  - [Client Setup](#client-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [How It Works](#how-it-works)

---

## Features

- 🔍 **RAG pipeline** — university documents chunked, embedded, and stored in Pinecone for semantic search
- 🧠 **HyDE (Hypothetical Document Embeddings)** — generates hypothetical questions per chunk for better retrieval accuracy
- 🌐 **Multilingual** — Hindi + English query and response support
- 📄 **OCR ingestion** — processes scanned PDFs and images of university notices via PaddleOCR
- 📊 **Structured extraction** — extracts tables, emails, phone numbers, URLs from notices
- ⚡ **Fast inference** — Groq (`llama-3.1-8b-instant`) for low-latency LLM responses
- 🔗 **Multi-vector embeddings** — `google/embedding-gemma-300m` (768-dim) stored in Pinecone with `factId` as MongoDB join key
- 🚀 **Service warmup** — MongoDB, Pinecone, and Groq connections pre-warmed at server startup

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│          React + TypeScript + Tailwind (Vite)           │
│              Chat UI  ──►  /api/query                   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────┐
│                   FastAPI Server                        │
│                                                         │
│   /injestion/storeNotice  ──►  OCR  ──►  Groq           │
│          │                    (PaddleOCR)  (summarize)  │
│          ▼                                              │
│      MongoDB (Beanie ODM)                               │
│      stores: factId, content, metadata                  │
│          │                                              │
│          ▼                                              │
│      Pinecone                                           │
│      stores: HyDE embeddings  ◄──  Gemma Embeddings     │
│                                                         │
│   /query  ──►  embed query  ──►  Pinecone search        │
│          ──►  fetch facts from MongoDB by factId        │
│          ──►  Groq LLM  ──►  final answer               │
└─────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- UUIDv7 as linking key between Pinecone vectors and MongoDB documents
- HyDE embeddings stored in Pinecone (not raw chunk embeddings) for better semantic retrieval
- Multi-vector per document — each fact/chunk gets multiple embeddings from different hypothetical questions
- Beanie 1.26.0 + Motor for fully async MongoDB access

---

## Tech Stack

### Server
| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Database | MongoDB (Beanie ODM + Motor) |
| Vector DB | Pinecone (cosine metric, dense index) |
| Embeddings | `google/embedding-gemma-300m` (768-dim) |
| LLM | Groq — `llama-3.1-8b-instant` |
| OCR | PaddleOCR 2.9.1 |
| Summarization | Groq + LangChain |
| Language | Python 3.11+ |

### Client
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Routing | React Router |
| State | React useState |

---

## Project Structure

```
Mentora/
├── client/                        # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── ChatPage.tsx       # Main chat interface
│   │   └── ...
│   ├── tsconfig.json
│   └── package.json
│
└── server/                        # FastAPI RAG microservice
    ├── injestion/
    │   ├── storeNotice.py         # Upload & OCR ingestion route
    │   └── ocr.py                 # PaddleOCR + Groq summarization
    ├── ocr/
    │   └── inputImg/              # Temp directory for uploaded files
    ├── utils/
    │   └── warmup.py              # Service warmup on startup
    ├── app/
    │   ├── config.py              # Settings & env vars
    │   └── db.py                  # MongoDB/Beanie init
    └── main.py                    # FastAPI app + lifespan
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB instance (local or Atlas)
- Pinecone account
- Groq API key
- Google Gemma embeddings API key

---

### Server Setup

```bash
# 1. Navigate to server
cd server

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy env file and fill in values
cp .env.example .env

# 5. Run the server
uvicorn main:app --reload --port 8000
```

---

### Client Setup

```bash
# 1. Navigate to client
cd client

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Client runs on `http://localhost:5173` by default.

---

## Environment Variables

Create a `.env` file inside `/server`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mentora

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=mentora-index

# Groq
GROQ_API_KEY=your_groq_api_key

# Gemma Embeddings
GEMMA_API_KEY=your_gemma_api_key
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/injestion/storeNotice` | Upload a notice (PDF/JPG/PNG) — runs OCR + stores in DB |
| `POST` | `/query` | Ask a question — returns RAG answer |

### `POST /injestion/storeNotice`

**Form data:** `file` — supported formats: `.pdf`, `.jpg`, `.jpeg`, `.png`

**Response:**
```json
{
  "message": "Successful",
  "data": {
    "response": "Summarized notice content...",
    "hasTable": true,
    "language": "en",
    "hasURL": false,
    "emails": ["example@gbu.ac.in"],
    "phones": ["9876543210"]
  }
}
```

---

## How It Works

### Ingestion Flow

1. Notice (PDF/image) uploaded via `/injestion/storeNotice`
2. PaddleOCR extracts raw text (Hindi + English)
3. Groq + LangChain summarizes and structures the content into JSON:
   - `response` — plain text summary with inline markdown tables
   - `hasTable`, `language`, `hasURL`, `emails`, `phones`
4. Facts are stored in **MongoDB** with a UUIDv7 `factId`
5. Hypothetical questions are generated per fact (HyDE)
6. Questions are embedded via Gemma (768-dim) and stored in **Pinecone** with the `factId` as metadata

### Query Flow

1. User query comes in
2. Query is embedded using the same Gemma model
3. Pinecone ANN search retrieves top-k similar hypothetical question vectors
4. `factId`s from results are used to fetch full fact content from MongoDB
5. Retrieved facts + original query are passed to Groq LLM
6. Final natural language answer returned to client

---

## Contributing

PRs are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

MIT