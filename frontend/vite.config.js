import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';
  
  return {
    plugins: [
      react(),
      // Add visualizer only in analyze mode
      isAnalyze && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      })
    ].filter(Boolean),
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      // Add chunk size warning limit
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          // Implement manual chunking strategy
          manualChunks: {
            // Core React dependencies
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Chart libraries - separate chunks for each
            'recharts': ['recharts'],
            'chart-js': ['chart.js'],
            'd3': ['d3'],
            'echarts': ['echarts'],
            'plotly': ['plotly.js'],
            'victory': ['victory'],
            // Other utilities
            'utils': ['axios', 'idb']
          },
          // Use content hash for cache busting
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      },
      // Enable minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            // Special handling for SSE endpoints
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (req.url?.includes('stream-analysis')) {
                console.log('🔗 Proxying SSE request:', req.url);
                proxyReq.setHeader('Cache-Control', 'no-cache');
                proxyReq.setHeader('Connection', 'keep-alive');
              }
            });
            
            proxy.on('proxyRes', (proxyRes, req, res) => {
              if (req.url?.includes('stream-analysis')) {
                console.log('📡 SSE response received:', proxyRes.statusCode);
                proxyRes.headers['cache-control'] = 'no-cache';
                proxyRes.headers['connection'] = 'keep-alive';
                proxyRes.headers['content-type'] = 'text/event-stream';
              }
            });
          }
        },
      },
      fs: {
        // Allow serving files from outside the project root
        allow: ['..'],
        strict: false
      },
    },
    base: '/',
    optimizeDeps: {
      force: true
    }
  }
})
