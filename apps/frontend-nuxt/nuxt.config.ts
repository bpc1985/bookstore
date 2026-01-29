import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineNuxtConfig({
  compatibilityDate: "2025-01-29",
  srcDir: './src',
  devtools: { enabled: true },
  pages: true,
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      global: true,
    },
  ],
  modules: ["@pinia/nuxt", "@nuxt/eslint"],
  pinia: {
    storesDirs: ['./src/stores'],
  },
  imports: {
    dirs: ["composables"],
    global: false,
  },
  devServer: {
    port: 3002,
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || "http://localhost:8000",
    },
  },
  typescript: {
    strict: false,
    typeCheck: false,
  },
  css: ["@/assets/styles/global.css"],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {
        base: resolve(__dirname, 'src'),
      },
      autoprefixer: {},
    },
  },
  app: {
    head: {
      title: "Bookstore",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
});
