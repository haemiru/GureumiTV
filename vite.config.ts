import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 배포를 위한 설정
  // ⚠️ 'VedioGenerator'를 실제 GitHub 저장소 이름으로 변경하세요!
  base: '/GureumiTV/',
})
