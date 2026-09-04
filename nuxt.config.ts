const siteUrl = process.env.SITE_URL || process.env.APP_URL || 'https://call.nusacontact.com'
const siteTitle = 'NusaCall by NusaContact'
const siteDescription = 'Manage all your WhatsApp Calling efficiently with our platform'
const ogImageUrl = `${siteUrl}/og-image.jpg`

export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/i18n', 'nuxt-vue3-google-signin'],
  ssr: false,

  devtools: {
    enabled: true
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'id'
      },
      title: siteTitle,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: siteDescription },
        { property: 'og:site_name', content: 'NusaCall' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: siteUrl },
        { property: 'og:title', content: siteTitle },
        { property: 'og:description', content: siteDescription },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:image:secure_url', content: ogImageUrl },
        { property: 'og:image:type', content: 'image/jpeg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: siteTitle },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:url', content: siteUrl },
        { name: 'twitter:title', content: siteTitle },
        { name: 'twitter:description', content: siteDescription },
        { name: 'twitter:image', content: ogImageUrl }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: siteUrl }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    fallback: 'light',
    componentName: 'ColorScheme',
    classSuffix: ''
  },

  runtimeConfig: {
    public: {
      siteUrl,
      apiUrl: process.env.API_BASE_URL,
      wsUrl: process.env.WS_BASE_URL,
      googleClientId: process.env.GOOGLE_CLIENT_ID
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  googleSignIn: {
    clientId: process.env.GOOGLE_CLIENT_ID
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'id', name: 'Bahasa Indonesia', file: 'id.json' }
    ],
    defaultLocale: 'id',
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      alwaysRedirect: true,
      fallbackLocale: 'id'
    }
  }
})
