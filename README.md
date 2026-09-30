# AI Document Detector

Portfolio project that estimates how likely a document is **AI-generated vs human-written**, using:

- **LLM judgment** (Groq, OpenAI-compatible API)
- **Stylometric heuristic** (phrase lists, sentence length, punctuation, structure) as a blend and offline fallback
- **Real accounts** (MongoDB + JWT + bcrypt) and per-user analysis history

Text is extracted in the browser — only plain text is sent to the backend / AI provider, never the original file.

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

## Tech Stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router, Recharts, pdf.js, mammoth |
| Backend  | Node.js, Express, Mongoose, JWT, bcryptjs, dotenv, cors                    |
| Database | MongoDB                                                                    |
| AI       | Groq (OpenAI-compatible) + local stylometric heuristic                     |

## Project Structure

```text
detector
├── server
│   ├── index.js
│   ├── middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models
│   │   ├── User.js
│   │   └── Analysis.js
│   ├── routes
│   │   ├── auth.js
│   │   └── analyze.js
│   └── utils
│       ├── aiDetect.js      # LLM judge + blend with heuristic
│       ├── heuristic.js     # Phrase lists + stylometric signals
│       └── errors.js
├── src
│   ├── App.jsx
│   ├── auth.js
│   ├── main.jsx
│   ├── readFile.js          # Browser-side PDF / DOCX / text extraction
│   ├── pages
│   │   ├── Home.jsx         # Analyzer + highlights + chart
│   │   ├── History.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   └── utils
│       ├── api.js
│       └── highlight.js     # Client-side AI / human phrase highlighting
├── package.json
└── vite.config.js
