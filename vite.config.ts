import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load environment variables from the current directory. 
    // Passing '' as the third argument allows loading variables without the VITE_ prefix.
    const env = loadEnv(mode, process.cwd(), '');
    
    // Determine the active API key, prioritizing 'API_KEY' but allowing 'GEMINI_API_KEY' as a fallback.
    const apiKey = env.API_KEY || env.GEMINI_API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // This 'define' block bakes the values into the JS bundle at build time.
        // It ensures process.env.API_KEY is available as required by the Gemini SDK.
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});