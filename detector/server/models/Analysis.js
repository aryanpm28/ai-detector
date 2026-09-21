const mongoose = require('mongoose');

const keywordHitSchema = new mongoose.Schema(
  {
    keyword: String,
    count: Number,
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      default: 'Pasted text',
    },
    // Only a short snippet is stored, not the full document — keeps
    // the DB small and avoids storing potentially sensitive full text.
    textSnippet: {
      type: String,
      maxlength: 500,
    },
    wordCount: Number,

    // Final blended score shown to the user
    aiScore: { type: Number, required: true },
    humanScore: { type: Number, required: true },

    // Breakdown of how the score was produced, for transparency
    source: {
      type: String,
      enum: ['ai_model', 'heuristic_fallback'],
      default: 'heuristic_fallback',
    },
    modelReasoning: String, // short explanation returned by the LLM, if used
    heuristicScore: {
      ai: Number,
      human: Number,
    },

    keywordHits: [keywordHitSchema],
    summary: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', analysisSchema);
