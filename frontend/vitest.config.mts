import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    include: ['**/*.spec.ts', '**/*.spec.tsx'],
    setupFiles: ['./test/setup.ts'],
  },
});
