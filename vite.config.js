import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/Capstone-2025-Team-1/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    testTimeout: 10000, // bump to 10s
    coverage: {
      provider: 'v8',                
      reporter: ['text', 'html'],    
      reportsDirectory: './coverage', 
      all: true,                     
      include: ['src/**/*.{js,jsx}'], 
    },
  },
})

