import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path'; // 절대경로 설정
import tailwindcss from '@tailwindcss/vite'; // Tailwind CSS

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true, // describe, test, expect 등 전역 변수 사용 허용
    environment: 'jsdom', // 브라우저 환경에서 테스트 실행
    setupFiles: './src/test/setup.ts', // 테스트 환경 설정 파일 경로
    passWithNoTests: true, //테스트 파일 없어도 통과!
    css: true, // CSS 모듈 지원 활성화
  },
});
