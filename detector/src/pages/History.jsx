import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/analyze')
      .then(({ data }) => setItems(data))
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/analyze/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {
      setError('Failed to delete that entry');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center text-sm font-bold">
              AI
            </div>
            <span className="font-semibold text-slate-800">Analysis History</span>
          </div>
          <Link to="/" className="text-sm text-primary-600 hover:underline">
            ← Back to analyzer
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
            {error}
          </div>
        )}

        {loading && <p className="text-sm text-slate-400">Loading…</p>}

        {!loading && items.length === 0 && (
          <div className="card p-6 text-center text-sm text-slate-400">
            No analyses yet — run one from the analyzer page.
          </div>
        )}

        {items.map((item) => (
          <div key={item._id} className="card p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-slate-800 truncate">{item.fileName}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(item.createdAt).toLocaleString()} · {item.wordCount} words
              </p>
              <p className="text-sm text-slate-600 mt-2">{item.summary}</p>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  item.source === 'ai_model'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                AI {item.aiScore}% · Human {item.humanScore}%
              </span>
            </div>
            <button
              onClick={() => handleDelete(item._id)}
              className="text-xs text-red-500 hover:underline shrink-0"
            >
              Delete
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}
