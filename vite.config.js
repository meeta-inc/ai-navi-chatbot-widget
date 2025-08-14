import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html',
          mobile: './test-mobile.html'
        }
      }
    },
    server: {
      port: 3000
    },
    // 환경변수 정의 (VITE_ 접두사가 있는 것만)
    define: {
      // 빌드 시 환경변수를 문자열로 치환
      __VITE_CLIENT_ID__: JSON.stringify(env.VITE_CLIENT_ID || 'RS000001'),
      __VITE_APP_ID__: JSON.stringify(env.VITE_APP_ID || '0001'),
      __VITE_CHATBOT_URL__: JSON.stringify(env.VITE_CHATBOT_URL || 'https://ainavi-dev.meeta.jp/'),
      __VITE_DEMO_TITLE__: JSON.stringify(env.VITE_DEMO_TITLE || 'チャットボットウィジェットテスト')
    },
    // HTML 내 환경변수 치환 활성화
    plugins: [
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          // %VITE_*% 패턴을 환경변수로 치환
          return html.replace(
            /%VITE_(\w+)%/g,
            (match, p1) => {
              const value = env[`VITE_${p1}`] || process.env[`VITE_${p1}`] || match;
              console.log(`Replacing ${match} with ${value}`);
              return value;
            }
          );
        }
      }
    ]
  };
});