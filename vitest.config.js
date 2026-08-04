import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['plugins/**/*.test.js', 'backend/**/*.test.js'],
    globals: true
  },
  resolve: {
    alias: {
      '@campusos/backend-core': path.resolve(__dirname, './backend/src')
    }
  }
});
