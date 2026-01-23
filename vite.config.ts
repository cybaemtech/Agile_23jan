import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Get current directory in a way that works in both dev and bundled production
const getCurrentDir = () => {
  if (typeof import.meta.dirname !== 'undefined') {
    return import.meta.dirname;
  }
  return path.dirname(fileURLToPath(import.meta.url));
};

const __dirname = getCurrentDir();

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/Agile' : '/',
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
      ]
      : []),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'https://cybaemtech.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/Agile/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request to:', proxyReq.getHeader('host') + proxyReq.path);
          });
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://cybaemtech.in',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/Agile/api'),
        secure: true,
        headers: {
          'Origin': 'https://cybaemtech.in'
        }
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-label', 'lucide-react'],
          form: ['react-hook-form', 'zod', '@hookform/resolvers'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
