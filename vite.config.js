import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist'
  },
  server: {
    port: 3000
  },
  // HTML 내 환경변수 치환 활성화
  plugins: [
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          /%VITE_(\w+)%/g,
          (match, p1) => process.env[`VITE_${p1}`] || match
        );
      }
    }
  ]
});