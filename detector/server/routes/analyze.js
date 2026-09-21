const express = require('express');
const Analysis = require('../models/Analysis');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { EmptyTextError, NotFoundError } = require('../utils/errors');
const { analyzeText } = require('../utils/aiDetect');

const router = express.Router();

// Every route below requires login
router.use(auth);

// POST /api/analyze — run detection and save it to history
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { text, fileName } = req.body;
    // Coerce keywords to string so .split never throws on null/undefined/number
    const keywords = typeof req.body.keywords === 'string' ? req.body.keywords : '';

    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new EmptyTextError();
    }

    const cleaned = text.trim();
    // Soft limit to protect the LLM and DB from extremely large pastes
    if (cleaned.length > 100_000) {
      throw new EmptyTextError('Text is too long (max ~100k characters). Please shorten it.');
    }

    const result = await analyzeText(cleaned);

    // Keyword search across the document
    const keywordList = keywords
      .split(/[,;\n]+/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20); // hard cap to prevent abuse

    const keywordHits = keywordList.map((kw) => {
      // Escape regex special characters so user input cannot break the pattern
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const matches = cleaned.match(regex);
      return { keyword: kw, count: matches ? matches.length : 0 };
    });

    let summary;
    if (result.ai >= 65) summary = 'This document shows strong signs of AI-generated content.';
    else if (result.human >= 65) summary = 'This document appears mostly human-written.';
    else summary = 'Mixed signals — the text may be a blend of AI and human writing.';

    const analysis = await Analysis.create({
      user: req.user._id,
      fileName: (fileName && String(fileName).slice(0, 200)) || 'Pasted text',
      textSnippet: cleaned.slice(0, 500),
      wordCount: result.wordCount,
      aiScore: result.ai,
      humanScore: result.human,
      source: result.source,
      modelReasoning: result.modelReasoning,
      heuristicScore: result.heuristicScore,
      keywordHits,
      summary,
    });

    res.status(201).json(analysis);
  })
);

// GET /api/analyze — list this user's analysis history, most recent first
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const history = await Analysis.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(history);
  })
);

// GET /api/analyze/:id — get one past analysis
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user._id });
    if (!analysis) throw new NotFoundError('Analysis not found');
    res.json(analysis);
  })
);

// DELETE /api/analyze/:id — remove one entry from history
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!analysis) throw new NotFoundError('Analysis not found');
    res.json({ message: 'Analysis deleted' });
  })
);

module.exports = router;
