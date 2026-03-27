import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Fix: Use '.' for environment directory as process.cwd() has type resolution issues in this environment
    const env = loadEnv(mode, '.', '');
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || env.API_KEY || env.GEMINI_API_KEY || '';

    return {
      server: { port: 3000, host: '0.0.0.0' },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      // Fix: Use path.resolve() instead of __dirname as __dirname is not defined in ESM
      resolve: { alias: { '@': path.resolve() } }
    };
});
