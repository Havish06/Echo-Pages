/**
 * Echo Pages Configuration
 * Centralizes environment variables and global constants.
 */

export const CONFIG = {
  // The API_KEY is accessed exclusively via process.env.API_KEY as per guidelines.
  // It is expected to be injected by the environment (e.g., Vercel, Vite, or a global shim).
  GEMINI_API_KEY: process.env.API_KEY,
  
  // Primary model for generation and analysis
  DEFAULT_MODEL: 'gemini-3-flash-preview',
  
  // Feature flags and limits
  MAX_TITLE_REGEN: 3,
  DAILY_LINE_CACHE_DURATION: 86400000, // 24 hours
  
  // External Links
  SOCIAL: {
    INSTAGRAM: 'https://instagram.com/echo_pages'
  }
};
