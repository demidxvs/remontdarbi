import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Vite konfiguracija ar React SWC spraudni.
export default defineConfig({
  plugins: [react()],
})
