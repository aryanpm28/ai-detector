# AI Document Detector

Portfolio project that estimates how likely a document is **AI-generated vs human-written**, using:

- **LLM judgment** (Groq, OpenAI-compatible API)
- **Stylometric heuristic** (phrase lists, sentence length, punctuation, structure) as a blend and offline fallback
- **Real accounts** (MongoDB + JWT + bcrypt) and per-user analysis history

Text is extracted in the browser — only plain text is sent to the backend / AI provider, never the original file.

## Live Demo

https://ai-detector-five-bay.vercel.app

## Features

- React form: upload a document or paste/write text
- File support: PDF, Word (`.docx`), TXT, MD, CSV, JSON, HTML, RTF, and other text formats (`pdf.js` + `mammoth` in the browser)
- Optional keyword search inside the document
- AI vs Human score with pie chart (Recharts)
- Text highlighting — AI-style phrases in red, human-style signals in green
- LLM short written rationale when the provider is available
- Graceful fallback to heuristic-only scoring if no API key or the provider fails (`source: "heuristic_fallback"`)
- Auth: register / login, JWT sessions, bcrypt-hashed passwords
- Saved analysis history per user (list + delete)
- Centralized Express error handling with domain-specific error types
- API rate limiting for authentication and analysis endpoints
- Responsive React interface

## How AI Detection Works

The application combines two signals.

### 1. Groq LLM

The backend sends the submitted text to Groq using its OpenAI-compatible API.

Current model:

```text
openai/gpt-oss-120b
