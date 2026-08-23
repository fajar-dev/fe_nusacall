# 🏗️ Project Overview — Nuxt Boilerplate

## Tentang Project

**Nuxt Boilerplate** — Starter template admin dashboard.
SPA (Single Page Application) dengan Nuxt 4, NuxtUI v4, dan Tailwind CSS v4.

- **SSR**: Disabled (`ssr: false`)
- **Color Mode**: Light only (preference: `light`)
- **Bahasa**: Multi-language via `@nuxtjs/i18n` — English (`en`) + Bahasa Indonesia (`id`). Lihat [i18n-guide.md](./i18n-guide.md)
- **Package Manager**: Bun 1.3.1

## Tech Stack

| Layer         | Teknologi            | Keterangan                                                        |
| ------------- | -------------------- | ----------------------------------------------------------------- |
| Framework     | Nuxt 4               | `nuxt ^4.4.6`                                                     |
| UI Library    | NuxtUI v4            | `@nuxt/ui ^4.7.1` — **Wajib digunakan**                           |
| i18n          | @nuxtjs/i18n         | `@nuxtjs/i18n ^10.6.0` — English + Indonesia, **Wajib digunakan** |
| Styling       | Tailwind CSS v4      | `tailwindcss ^4.3.0`                                              |
| Icons         | Lucide via Iconify   | `@iconify-json/lucide ^1.2.108`                                   |
| Validation    | Zod v4               | `zod ^4.4.3`                                                      |
| HTTP Client   | Axios                | `axios ^1.16.1`                                                   |
| Auth Provider | Google Sign-In       | `nuxt-vue3-google-signin 0.0.13`                                  |
| Linting       | ESLint + Nuxt ESLint | `@nuxt/eslint ^1.15.2`                                            |
| Type Checking | TypeScript + vue-tsc | `typescript ^6.0.3`                                               |

## Struktur Folder

```
fe/
├── app/
│   ├── app.vue                    # Root component (UApp wrapper)
│   ├── app.config.ts              # NuxtUI theme config (colors, defaults)
│   ├── assets/
│   │   └── css/
│   │       └── main.css           # Font, Tailwind imports, custom color tokens
│   ├── components/
│   │   ├── BrandLogo.vue          # Logo + nama app
│   │   ├── Header.vue             # Page header (title, tabs, actions, mobile nav)
│   │   ├── Sidebar.vue            # Navigasi sidebar (collapsible, reaktif terhadap locale)
│   │   ├── LanguageSwitcher.vue   # Switch bahasa (kanan atas Header & auth layout)
│   │   ├── UserPopover.vue        # User profile dropdown + logout
│   │   ├── DeleteModal.vue        # Generic delete confirmation modal
│   │   └── <feature>/             # Feature-specific components
│   │       └── AddModal.vue       # Auto-named: <FeatureAddModal />
│   │       └── UpdateModal.vue
│   │       └── DeleteModal.vue
│   ├── composables/
│   │   ├── useAuth.ts             # Auth state accessor (readonly)
│   │   ├── useNavigation.ts       # Sidebar navigation config + active state (i18n-aware)
│   │   └── error-helper.ts        # Global error handler untuk service layer
│   ├── layouts/
│   │   ├── dashboard.vue          # Layout utama: sidebar + main content
│   │   └── auth.vue               # Layout auth: split-screen (gradient | form)
│   ├── middleware/
│   │   ├── auth.global.ts         # Global guard: redirect ke sign-in jika tidak auth
│   │   └── guest.ts               # Guest-only: redirect ke home jika sudah login
│   ├── pages/
│   │   ├── index.vue              # Dashboard (layout: dashboard)
│   │   ├── auth/
│   │   │   ├── sign-in.vue        # Login page (layout: auth, middleware: guest)
│   │   │   ├── forgot-password.vue
│   │   │   └── reset-password.vue
│   │   └── <feature>/
│   │       └── index.vue          # CRUD listing page
│   ├── plugins/
│   │   └── *.client.ts            # Client-only plugin
│   ├── services/
│   │   ├── api-service.ts         # Axios instance factory + interceptors
│   │   ├── auth-service.ts        # Auth: login, logout, refresh, Google OAuth
│   │   └── <feature>-service.ts   # Feature CRUD service
│   └── types/
│       ├── auth.d.ts              # User, AuthData, ApiResponse, AuthResponse
│       └── <feature>.d.ts         # Feature types + payload + PaginationMeta
├── i18n/
│   └── locales/
│       ├── en.json                # WAJIB sinkron dengan id.json — lihat docs/i18n-guide.md
│       └── id.json
├── docs/                          # Dokumentasi project ini
├── public/                        # Static assets (favicon, SVGs)
├── nuxt.config.ts                 # Nuxt configuration (termasuk block `i18n`)
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

## Konfigurasi Design System

### Warna (dari `main.css`)

Project menggunakan custom color palette yang di-override di `@theme static`:

| Nama     | Primary (500) | Fungsi                                 |
| -------- | ------------- | -------------------------------------- |
| `green`  | `#009838`     | **Primary** — Brand color utama        |
| `yellow` | `#D97706`     | **Warning**                            |
| `red`    | `#B91C1C`     | **Error/Danger**                       |
| `slate`  | —             | **Neutral** — Teks, border, background |

### Font

- **Font Family**: `Geist` (Google Fonts)
- Didefinisikan di `main.css`: `--font-sans: 'Geist', sans-serif`

### NuxtUI Default Variants (dari `app.config.ts`)

```typescript
ui: {
  colors: {
    primary: 'green',
    error: 'red',
    warning: 'yellow',
    neutral: 'slate'
  },
  button: {
    defaultVariants: { size: 'lg' }
  },
  input: {
    defaultVariants: { size: 'lg' }
  }
}
```

> **Catatan**: Button dan Input default size adalah `lg`. Tidak perlu menambahkan `size="lg"` secara manual kecuali perlu override.

## Environment Variables

| Variable           | Contoh                      | Keterangan             |
| ------------------ | --------------------------- | ---------------------- |
| `API_BASE_URL`     | `http://localhost:4000/api` | Base URL API backend   |
| `GOOGLE_CLIENT_ID` | —                           | Google OAuth Client ID |

## ESLint Rules

- **CommaDangle**: `never` — Tidak ada trailing comma
- **BraceStyle**: `1tbs` — One True Brace Style

## Layouts

### 1. `dashboard` Layout

- Sidebar kiri (desktop) + drawer overlay (mobile)
- Main content area dengan scroll
- Responsive: sidebar hidden di mobile, diganti hamburger menu
- State `isMobileMenuOpen` di-share via `useState('isMobileMenuOpen')`
- `LanguageSwitcher` di kanan atas `Header.vue` (mobile bar + desktop top row)

### 2. `auth` Layout

- Split screen: 60% gradient background (kiri) | 40% form (kanan)
- Mobile: full-width form only
- Background menggunakan SVG gradient + grid overlay
- `LanguageSwitcher` di kanan atas panel form

## Authentication Flow

1. **Global Middleware** (`auth.global.ts`): Cek token di setiap navigasi
2. **Guest Middleware** (`guest.ts`): Redirect user yang sudah login
3. **Session Storage**: `localStorage` (accessToken, refreshToken, user JSON)
4. **Token Refresh**: Auto-refresh via Axios interceptor saat mendapat 401
5. **Google OAuth**: Menggunakan `nuxt-vue3-google-signin` + authorization code flow
