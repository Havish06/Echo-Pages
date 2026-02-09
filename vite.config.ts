import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // loadEnv loads variables from .env files. 
    // Passing '' as the 3rd arg allows it to load variables without the VITE_ prefix.
    const env = loadEnv(mode, process.cwd(), '');
    
    /**
     * Vercel environment variables are available in Node's process.env during build.
     * We check both the loaded .env file and the Node process environment.
     */
    const apiKey = env.GEMINI_API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        /**
         * Vite's 'define' performs a static string replacement in the source code.
         * This satisfies the SDK's requirement for process.env.API_KEY.
         */
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