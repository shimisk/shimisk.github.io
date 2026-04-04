import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const LOCAL_PROXY_PATH = '/__rss_proxy'

function createRssProxyMiddleware() {
  return async (req, res, next) => {
    if (!req.url) return next()

    const requestUrl = new URL(req.url, 'http://localhost')
    if (requestUrl.pathname !== LOCAL_PROXY_PATH) return next()

    const target = requestUrl.searchParams.get('url')
    if (!target) {
      res.statusCode = 400
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Missing url query parameter' }))
      return
    }

    let parsed
    try {
      parsed = new URL(target)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Unsupported protocol')
      }
    } catch {
      res.statusCode = 400
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Invalid target URL' }))
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    try {
      const upstream = await fetch(parsed.toString(), {
        signal: controller.signal,
        headers: {
          accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
          'user-agent': 'ParallaxNews/1.0 (+local-proxy)',
        },
      })

      const body = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('access-control-allow-origin', '*')
      res.setHeader('cache-control', 'no-store')
      res.setHeader(
        'content-type',
        upstream.headers.get('content-type') || 'text/plain; charset=utf-8'
      )
      res.end(body)
    } catch (err) {
      const isAbort = err?.name === 'AbortError'
      res.statusCode = isAbort ? 504 : 502
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          error: isAbort ? 'Upstream timeout' : 'Proxy request failed',
          detail: err?.message ?? 'Unknown error',
        })
      )
    } finally {
      clearTimeout(timer)
    }
  }
}

function localRssProxyPlugin() {
  return {
    name: 'local-rss-proxy',
    configureServer(server) {
      server.middlewares.use(createRssProxyMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use(createRssProxyMiddleware())
    },
  }
}

export default defineConfig({
  plugins: [
    localRssProxyPlugin(),
    react(),
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Parallax News',
        short_name: 'Parallax',
        description: 'Compare news coverage across outlets, see bias ratings, find what was not reported.',
        theme_color: '#1a1208',
        background_color: '#f5f0e8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      }
    })
  ]
})
