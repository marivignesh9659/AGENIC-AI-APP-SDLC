// Centralised Groq model helper
// All agents import from here — easy to swap provider later

import { createGroq } from '@ai-sdk/groq';

if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  GROQ_API_KEY not set in .env — agents will fail at runtime');
}

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY ?? '',
});

// Default model used across all agents
export const defaultModel = groqClient('llama-3.3-70b-versatile');

// Export client for agents that need custom model strings
export { groqClient };