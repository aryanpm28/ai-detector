/**
 * Extract plain text from common document types in the browser.
 * Supports: txt, md, csv, json, rtf, html, docx, pdf, and other text-like files.
 */

import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Use CDN worker so Vite does not need special worker config
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

const TEXT_EXTS = new Set([
  'txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'xml', 'html', 'htm',
  'rtf', 'log', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp',
  'css', 'scss', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf', 'sql',
]);

function getExt(name) {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

async function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

async function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function extractPdf(file) {
  const buffer = await readAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items.map((item) => item.str).join(' ');
    pages.push(line);
  }
  return pages.join('\n\n');
}

async function extractDocx(file) {
  const buffer = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || '';
}

/**
 * @param {File} file
 * @returns {Promise<{ text: string, warning?: string }>}
 */
export async function extractTextFromFile(file) {
  const ext = getExt(file.name);
  const mime = (file.type || '').toLowerCase();

  // Word
  if (ext === 'docx' || mime.includes('wordprocessingml')) {
    const text = await extractDocx(file);
    return { text };
  }

  // Old .doc is not well supported in browser — warn
  if (ext === 'doc') {
    return {
      text: '',
      warning: 'Old .doc format is not supported. Please save as .docx or .txt and try again.',
    };
  }

  // PDF
  if (ext === 'pdf' || mime === 'application/pdf') {
    const text = await extractPdf(file);
    return { text };
  }

  // Plain / code / markup text
  if (TEXT_EXTS.has(ext) || mime.startsWith('text/') || mime === 'application/json') {
    const text = await readAsText(file);
    return { text };
  }

  // Fallback: try reading as text (works for many unknown extensions)
  try {
    const text = await readAsText(file);
    if (text && /[\x00-\x08\x0E-\x1F]/.test(text.slice(0, 500))) {
      return {
        text: '',
        warning: `Binary file ".${ext || 'unknown'}" cannot be read as text. Try PDF, DOCX, TXT, or MD.`,
      };
    }
    return { text };
  } catch {
    return {
      text: '',
      warning: `Could not read ".${ext || 'unknown'}". Supported: PDF, DOCX, TXT, MD, CSV, JSON, HTML, and similar text files.`,
    };
  }
}

export const ACCEPTED_EXTENSIONS =
  '.txt,.md,.markdown,.pdf,.docx,.csv,.tsv,.json,.xml,.html,.htm,.rtf,.log,.js,.jsx,.ts,.tsx,.py,.css,.yml,.yaml';
