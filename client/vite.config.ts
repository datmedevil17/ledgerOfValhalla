import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  optimizeDeps: {
    include: [
      '@solana/kit',
      '@solana/web3.js',
      '@coral-xyz/anchor',
    ],
  },
  resolve: {
    dedupe: ['@solana/kit', '@solana/web3.js'],
  },
})
