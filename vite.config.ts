import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  build: {
    // Manifest lets the size script tell initial chunks from lazy ones.
    manifest: true,
    // Keep fonts and everything else as files so the CSP never needs data: fonts.
    assetsInlineLimit: 0,
    target: 'es2022',
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
