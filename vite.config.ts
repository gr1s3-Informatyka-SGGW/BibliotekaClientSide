import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'
import reactInspector from 'vite-plugin-react-inspector'

// https://vite.dev/config/
export default defineConfig({
  plugins: [basicSsl(), react(), tailwindcss(), reactInspector()],
})
