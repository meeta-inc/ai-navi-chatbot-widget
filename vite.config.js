import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/chatbot-widget.js',
      name: 'ChatbotWidget',
      fileName: 'chatbot-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        extend: true
      }
    },
    outDir: 'dist'
  },
  server: {
    port: 3000
  }
});