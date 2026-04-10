import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: [
      // Resolve bare directory import that tsconfigPaths doesn't expand to index files.
      // Use regex for exact match so @/actions/get-projects etc. are unaffected.
      {
        find: /^@\/actions$/,
        replacement: path.resolve(__dirname, 'src/actions/index.ts'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
  },
})