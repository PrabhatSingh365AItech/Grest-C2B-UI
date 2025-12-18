import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4200,
    host: '0.0.0.0',  // Listen on all network interfaces
  },
  build: {
    outDir: 'build', // specify the output directory
  },
})
