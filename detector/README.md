AI Document Detector

Portfolio project that estimates how likely a document is AI-generated vs human-written, using:





LLM judgment (Groq, OpenAI-compatible API)



Stylometric heuristic (phrase lists, sentence length, punctuation, structure) as a blend and offline fallback



Real accounts (MongoDB + JWT + bcrypt) and per-user analysis history

Text is extracted in the browser — only plain text is sent to the backend / AI provider, never the original file.

Features





React form: upload a document or paste/write text



File support: PDF, Word (.docx), TXT, MD, CSV, JSON, HTML, RTF, and other text formats (pdf.js + mammoth in the browser)



Optional keyword search inside the document



AI vs Human score with pie chart (Recharts)



Text highlighting — AI-style phrases in red, human-style signals in green



LLM short written rationale when the provider is available



Graceful fallback to heuristic-only scoring if no API key or the provider fails (source: "heuristic_fallback")



Auth: register / login, JWT sessions, bcrypt-hashed passwords



Saved analysis history per user (list + delete)



Centralized Express error handling with domain-specific error types

Tech Stack







Layer



Technology





Frontend



React 18, Vite, Tailwind CSS, Axios, React Router, Recharts, pdf.js, mammoth





Backend



Node.js, Express, Mongoose, JWT, bcryptjs, dotenv, cors





Database



MongoDB





AI



Groq (OpenAI-compatible) + local stylometric heuristic

Project Structure

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

How detection works





LLM path (server/utils/aiDetect.js): text is sent to Groq with a system prompt asking for aiProbability (0–100) and a short reasoning. That score is blended with the heuristic (~75% model / 25% heuristic).



Heuristic path (server/utils/heuristic.js): counts a large list of AI-style phrases and human signals, plus sentence length, punctuation patterns, and simple structure signals. Used alone when no API key is set or the provider call fails.



Highlighting (src/utils/highlight.js): the same phrase lists mark the analyzed text in the UI (red = AI-style, green = human-style).

Results are labeled with source: "ai_model" or source: "heuristic_fallback" so they are never presented as more certain than they are.

Setup

1. MongoDB

Run a local MongoDB instance. Default URI:

mongodb://localhost:27017/ai-detector

2. Backend

cd server
npm install
cp .env.example .env

Edit .env:

PORT=5001
MONGODB_URI=mongodb://localhost:27017/ai-detector
JWT_SECRET=          # required — generate below
OPENAI_API_KEY=      # optional — Groq key; leave blank for heuristic-only
CLIENT_ORIGIN=http://localhost:5173

Generate a strong JWT_SECRET (do not reuse the example value):

node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

Get a free Groq API key at console.groq.com if you want live LLM scoring. Without it the app still works in heuristic-only mode.

Start the server:

npm run dev

You should see:

✅ Connected to MongoDB
🚀 Server running on http://localhost:5001

Confirm in the browser: http://localhost:5001 →
{ "message": "AI Detector API is running 🚀" }

3. Frontend

cd ..          # back to detector/
npm install
cp .env.example .env   # optional; defaults to http://localhost:5001/api
npm run dev

Open the URL Vite prints (usually http://localhost:5173; sometimes 5174 if 5173 is busy).

If the frontend port is 5174, either set CLIENT_ORIGIN=http://localhost:5174 in server/.env and restart the backend, or allow both ports in CORS (see server/index.js).

4. Use the app





Sign up (account stored in MongoDB, password hashed with bcrypt)



Upload a file or paste/write text



Optionally add keywords to search



Click Analyze document



View scores, rationale, highlights, and history

Supported file types







Type



Extensions





PDF



.pdf





Word



.docx (not old .doc)





Text



.txt, .md, .csv, .json, .html, .rtf, .log, code files, etc.

Parsing runs entirely in the browser. Only extracted text is sent to the API.

API

Protected routes require:

Authorization: Bearer <jwt>







Method



Endpoint



Description





POST



/api/auth/register



Create account





POST



/api/auth/login



Login → JWT + user





GET



/api/auth/me



Current user (protected)





POST



/api/analyze



Run detection, save to history (protected)





GET



/api/analyze



List this user’s history (protected)





GET



/api/analyze/:id



One analysis (protected)





DELETE



/api/analyze/:id



Delete one entry (protected)

Example: analyze

{
  "text": "In conclusion, it is important to note that furthermore...",
  "fileName": "essay.txt",
  "keywords": "ethics, machine learning"
}

Errors go through a centralized handler (server/middleware/errorHandler.js) with domain-specific types (server/utils/errors.js): validation, auth, duplicate email, not-found, empty text, etc.

Security notes





Passwords are hashed with bcrypt; never stored or logged in plaintext



.env is git-ignored on both frontend and backend — copy from .env.example and fill your own values; never commit real secrets



Only extracted text (not the original file) is sent to the backend or the AI provider



JWT is required for all analysis and history routes

Screenshots

Add screenshots under screenshots/ if you like, for example:

![API running](screenshots/api-running.png)
![Analyzer](screenshots/analyzer.png)
![Highlights](screenshots/highlights.png)