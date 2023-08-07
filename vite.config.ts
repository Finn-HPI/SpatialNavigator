import { defineConfig } from 'vite';

import path from "node:path"

export default defineConfig({
  root: './src',
  resolve: {
    alias: {
      '@icons' : path.resolve(__dirname, './src/'),
      '@assets' : path.resolve(__dirname, './src/assets')
    }
  },
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
    commonjsOptions: { include: [] },
  },
  
});
