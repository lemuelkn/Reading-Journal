import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      // The Google GenAI SDK expects process.env.API_KEY to be available.
      // We map it to the VITE_GEMINI_API_KEY environment variable here.
      // Added || '' to ensure it doesn't crash if the key is missing.
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
    }
  }
})