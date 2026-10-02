# AI Document Detector

Portfolio project that estimates how likely a document is **AI-generated vs human-written**, using:

- **LLM judgment** (Groq, OpenAI-compatible API)
- **Stylometric heuristic** (phrase lists, sentence length, punctuation, structure) as a blend and offline fallback
- **Real accounts** (MongoDB + JWT + bcrypt) and per-user analysis history

Text is extracted in the browser — only plain text is sent to the backend / AI provider, never the original file.

## Live Demo

https://ai-detector-five-bay.vercel.app

## Features

- Upload a document or paste/write text (PDF, DOCX, TXT, MD, CSV, JSON, HTML, and more)
- Optional keyword search
- AI vs Human score with pie chart (Recharts)
- Text highlighting (AI-style in red, human-style in green)
- LLM rationale when the provider is available
- Heuristic-only fallback if Groq is unavailable (`source: "heuristic_fallback"`)
- Register / login with JWT + bcrypt
- Per-user analysis history (list + delete)
- Rate limiting on auth and analyze endpoints
- Centralized Express error handling

## How detection works

1. **Groq LLM** (`openai/gpt-oss-120b`) — returns AI probability (0–100) and short reasoning  
2. **Local heuristic** — phrase lists, sentence length, punctuation, structure  

Final score: **75% LLM + 25% heuristic**. Falls back to heuristic-only if the provider fails.

> Detection is probabilistic — not definitive proof of authorship.

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 18, Vite, Tailwind, Axios, React Router, Recharts, pdf.js, mammoth |
| Backend  | Node.js, Express, Mongoose, JWT, bcryptjs |
| Database | MongoDB Atlas |
| AI       | Groq + local stylometric heuristic |
| Hosting  | Vercel |

## Project Structure

```text
ai-detector/
├── docs/                  # Screenshots
└── detector/
    ├── public/            # favicon
    ├── server/            # Express API
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   └── utils/         # aiDetect.js, heuristic.js
    ├── src/               # React app
    │   ├── pages/
    │   └── utils/
    └── vercel.json
Setup
Backend
Bashcd detector/server
npm install
# set env vars (see below)
npm run dev   # http://localhost:5001
Frontend
Bashcd detector
npm install
npm run dev   # http://localhost:5173
Environment Variables

VariablePurposeMONGODB_URIMongoDB connection stringJWT_SECRETJWT signing secretOPENAI_API_KEYGroq API key (name is OpenAI-style; provider is Groq)CLIENT_ORIGINFrontend origin for CORSPORTLocal backend port (default 5001)
Production frontend uses same-origin /api.
API

MethodEndpointAuthPOST/api/auth/registerNoPOST/api/auth/loginNoGET/api/auth/meJWTPOST/api/analyzeJWTGET/api/analyzeJWTGET/api/analyze/:idJWTDELETE/api/analyze/:idJWT
Header: Authorization: Bearer <token>
Deployment
textVercel
├── React + Vite frontend
└── Express backend → MongoDB Atlas → Groq
/api/* → backend · /* → frontend (SPA)
Security notes

Passwords hashed with bcrypt; secrets via env (not committed)
JWT on protected routes; ownership checks on history
Rate limits: auth 30/15min, analyze 20/min
Only text snippets stored — not full documents

Author
Aryan Patil · GitHub · Live demo
textShort enough for GitHub, still covers demo, model, stack, setup, env, API, and deploy.
