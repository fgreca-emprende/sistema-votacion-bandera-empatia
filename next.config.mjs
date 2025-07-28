/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 🖼️ OPTIMIZACIÓN DE IMÁGENES
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 📦 SERVER EXTERNAL PACKAGES (CORREGIDO)
  serverExternalPackages: ['sharp'],
  
  // 🚀 OPTIMIZACIONES EXPERIMENTALES
  experimental: {
    // Lazy loading y optimizaciones de bundle
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      'recharts',
      '@tanstack/react-query'
    ],
    
    // Mejoras de performance
    scrollRestoration: true,
    
    // Bundle splitting inteligente
    esmExternals: true,
  },
  
  // ⚡ COMPRESIÓN Y HEADERS
  compress: true,
  
  // 🎯 WEBPACK OPTIMIZATIONS para Lazy Loading
  webpack: (config, { dev, isServer }) => {
    // Solo en producción
    if (!dev && !isServer) {
      // Configurar chunk splitting optimizado
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunks separados
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            
            // React Query en chunk separado
            reactQuery: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query/,
              name: 'react-query',
              priority: 30,
              chunks: 'all',
            },
            
            // Recharts en chunk separado (es pesado)
            recharts: {
              test: /[\\/]node_modules[\\/]recharts/,
              name: 'recharts',
              priority: 30,
              chunks: 'all',
            },
            
            // Radix UI components
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui/,
              name: 'radix-ui',
              priority: 25,
              chunks: 'all',
            },
            
            // Lucide icons
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react/,
              name: 'lucide-icons',
              priority: 25,
              chunks: 'all',
            },
            
            // Admin components en chunk separado
            admin: {
              test: /[\\/](admin|dashboard|periods)/,
              name: 'admin-components',
              priority: 20,
              chunks: 'all',
              minChunks: 1,
            },
            
            // Common UI components
            common: {
              test: /[\\/]components[\\/]ui/,
              name: 'ui-components',
              priority: 15,
              chunks: 'all',
              minChunks: 2,
            },
          },
        },
      }
      
      // Tree shaking mejorado
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }
    
    return config
  },
  
  // Headers de seguridad y performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // Cache estático para imágenes
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache para assets estáticos
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache para chunks de JavaScript
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig