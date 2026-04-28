import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { ingestApiPlugin } from './scripts/lib/vite-ingest-plugin';
import { chatApiPlugin } from './scripts/lib/vite-chat-plugin';

export default defineConfig({
  plugins: [react(), ingestApiPlugin(), chatApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
