import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    'process.env': {}
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI chunk for component libraries
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
          // Maps chunk for Google Maps
          maps: ['@react-google-maps/api'],
          // Query chunk for TanStack Query
          query: ['@tanstack/react-query'],
          // Supabase chunk
          supabase: ['@supabase/supabase-js'],
          // Icons chunk
          icons: ['lucide-react']
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 300
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
}));
