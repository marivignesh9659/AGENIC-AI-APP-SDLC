// Centralised model helper
// All agents import defaultModel from here.
// Currently using Google Gemini 2.5 Flash-Lite.

import { google } from '@ai-sdk/google';

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.warn(
    '⚠️ GOOGLE_GENERATIVE_AI_API_KEY not set in .env — agents will fail at runtime',
  );
}

// Default model used across all agents
export const defaultModel = google('gemini-2.5-flash-lite');