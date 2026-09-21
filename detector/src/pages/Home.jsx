import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getSession, logout } from '../auth';
import { extractTextFromFile, ACCEPTED_EXTENSIONS } from '../readFile';
import api from '../utils/api';
import { highlightText } from '../utils/highlight';

const COLORS = ['#0ea5e9', '#10b981']; // AI blue, Human green

export default function Home() {
  const user = getSession();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('');
  const [keywords, setKeywords] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);
    setFileError('');
    setLoadingFile(true);

    try {
      const { text: extracted, warning } = await extractTextFromFile(file);
      if (warning) {
        setFileError(warning);
        if (!extracted) setText('');
        else setText(extracted);
      } else {
        setText(extracted);
      }
    } catch (err) {
      setFileError(err.message || 'Failed to read this file');
      setText('');
    } finally {
      setLoadingFile(false);
      e.target.value = '';
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setResult(null);
    if (fileName) setFileName('');
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setAnalyzeError('Upload a file or write/paste text first.');
      return;
    }

    setAnalyzing(true);
    setAnalyzeError('');
    try {
      // This now runs on the backend: an LLM judges AI-likelihood,
      // blended with a lightweight heuristic signal, and the result
      // is saved to this user's history in MongoDB.
      const { data } = await api.post('/analyze', {
        text,
        fileName: fileName || undefined,
        keywords,
      });
      setResult(data);
    } catch (err) {
      setAnalyzeError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const chartData = result
    ? [
        { name: 'AI', value: result.aiScore },
        { name: 'Human', value: result.humanScore },
      ]
    : [];

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
              AI
            </div>
            <span className="font-semibold text-slate-800">Document Detector</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/history" className="text-sm text-slate-500 hover:text-primary-600">
              History
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowProfile((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 text-sm"
              >
                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline text-slate-600">{user?.name}</span>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-1 w-56 card p-3 shadow-lg z-30">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate mb-3">{user?.email}</p>
                  <button onClick={handleLogout} className="btn-ghost w-full text-sm">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Left column */}
          <div className="space-y-5">
            <div className="card p-5">
              <h2 className="font-semibold text-slate-800 mb-1">Document Upload</h2>
              <p className="text-xs text-slate-500 mb-4">
                PDF, Word (.docx), TXT, MD, CSV, JSON, HTML, and more
              </p>

              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                className="hidden"
                onChange={handleFile}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loadingFile}
                className="w-full border-2 border-dashed border-slate-300 hover:border-primary-400 rounded-xl py-8 text-center transition-colors bg-slate-50 hover:bg-primary-50/40 disabled:opacity-60"
              >
                {loadingFile ? (
                  <p className="text-sm font-medium text-slate-500">Reading file…</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-600">
                      {fileName || 'Click to upload document'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      .pdf · .docx · .txt · .md · .csv · .json · .html
                    </p>
                  </>
                )}
              </button>

              {fileError && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {fileError}
                </p>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-slate-800">Or write / paste text</h2>
                {wordCount > 0 && (
                  <span className="text-xs text-slate-400">{wordCount} words</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Type or paste content directly — no file needed
              </p>
              <textarea
                className="input min-h-[140px] resize-y font-mono text-[13px] leading-relaxed"
                placeholder="Paste or type your document text here…"
                value={text}
                onChange={handleTextChange}
              />
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-slate-800 mb-1">Keywords to search</h2>
              <p className="text-xs text-slate-500 mb-3">
                Optional — comma-separated words to find in the document
              </p>
              <textarea
                className="input min-h-[80px] resize-y"
                placeholder="e.g. machine learning, neural network, ethics"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            {analyzeError && (
              <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                {analyzeError}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={analyzing || loadingFile}
              className="btn-primary w-full py-3 text-base"
            >
              {analyzing ? 'Analyzing…' : 'Analyze document'}
            </button>
          </div>

          {/* Right column – pie chart */}
          <div className="card p-5 min-h-[420px] flex flex-col">
            <h2 className="font-semibold text-slate-800 mb-1">AI vs Human</h2>
            <p className="text-xs text-slate-500 mb-4">
              AI-model judgment blended with a stylometric heuristic signal
            </p>

            {!result ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center px-4">
                Upload a file or write text, then click Analyze
              </div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={3}
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 text-sm text-slate-700">
                  {result.summary}
                  {result.wordCount > 0 && (
                    <span className="text-slate-400"> · {result.wordCount} words</span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      result.source === 'ai_model'
                        ? 'bg-primary-50 text-primary-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {result.source === 'ai_model' ? 'AI-model judgment' : 'Heuristic fallback (AI provider unavailable)'}
                  </span>
                </div>

                {result.modelReasoning && (
                  <p className="mt-2 text-xs text-slate-500 italic">"{result.modelReasoning}"</p>
                )}

                {result.keywordHits?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Keyword hits</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywordHits.map((h) => (
                        <span
                          key={h.keyword}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            h.count > 0
                              ? 'bg-primary-50 text-primary-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {h.keyword}: {h.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Highlighted text – AI phrases vs human signals */}
                {text.trim() && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-500">Text highlights</p>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-200 border border-red-300" />
                          AI-style
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-300" />
                          Human-style
                        </span>
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
                      {highlightText(text).map((seg, i) => {
                        if (seg.type === 'ai') {
                          return (
                            <mark
                              key={i}
                              className="bg-red-100 text-red-900 rounded px-0.5 border-b border-red-300"
                              title="Common AI-style phrase"
                            >
                              {seg.text}
                            </mark>
                          );
                        }
                        if (seg.type === 'human') {
                          return (
                            <mark
                              key={i}
                              className="bg-emerald-100 text-emerald-900 rounded px-0.5 border-b border-emerald-300"
                              title="Human-style / informal signal"
                            >
                              {seg.text}
                            </mark>
                          );
                        }
                        return <span key={i}>{seg.text}</span>;
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
