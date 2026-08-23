# Nuxt Boilerplate — Admin Dashboard (Nuxt 4)

> **BACA SEMUA INSTRUKSI INI SEBELUM MENULIS KODE APAPUN.**
> Dokumentasi lengkap ada di folder `docs/`. File ini adalah ringkasan aturan kritis.
>
> File ini (`AGENTS.md`) adalah format standar lintas-tool (Cursor, Codex CLI, Copilot, Aider, dll).
> Untuk Claude Code, isi yang sama juga tersedia di `CLAUDE.md` (auto-loaded oleh Claude Code).
> **Kedua file harus tetap sinkron** — kalau salah satu diubah, update yang satunya juga.

## Tech Stack

- **Nuxt 4** (`^4.4.6`) — SSR disabled, SPA mode
- **NuxtUI v4** (`@nuxt/ui ^4.7.1`) — **WAJIB digunakan untuk semua UI**
- **@nuxtjs/i18n** (`^10.6.0`) — **WAJIB untuk semua teks UI** (English + Bahasa Indonesia)
- **Tailwind CSS v4** (`^4.3.0`) — Utility-first CSS
- **Zod v4** (`^4.4.3`) — Schema validation untuk forms
- **Axios** (`^1.16.1`) — HTTP client
- **TypeScript** (`^6.0.3`) — Strict mode
- **Bun** (`1.3.1`) — Package manager
- **Icons**: `@iconify-json/lucide` — Prefix: `i-lucide-*`

## Setup & Commands

```bash
bun install       # install dependencies
bun run dev       # dev server (http://localhost:3000)
bun run build     # production build
bun run typecheck # nuxt typecheck (vue-tsc) — jalankan sebelum menganggap task selesai
bun run lint      # eslint
```

Tidak ada test runner otomatis di project ini saat ini. Verifikasi perubahan lewat `bun run typecheck` + `bun run lint` + cek visual di browser (dev server).

## ⛔ LARANGAN KERAS

### 1. DILARANG Hardcode CSS / Arbitrary Values

```
❌ DILARANG: px-[10px], m-[5px], w-[200px], h-[50vh], text-[14px], gap-[12px], max-w-[420px]
✅ GUNAKAN:  px-2.5,    m-1,     w-52,      h-screen,  text-sm,     gap-3,      max-w-md
```

### 2. WAJIB Gunakan NuxtUI Components

| Kebutuhan | Gunakan | JANGAN Gunakan |
|-----------|---------|----------------|
| Button | `<UButton>` | `<button class="...">` |
| Input | `<UInput>` | `<input class="...">` |
| Select | `<USelect>` / `<USelectMenu>` | `<select>` |
| Form | `<UForm>` + `<UFormField>` | Custom validation |
| Modal | `<UModal>` | Custom modal |
| Table | `<UTable>` | Custom table / `<table>` |
| Dropdown | `<UDropdownMenu>` | Custom dropdown |
| Pagination | `<UPagination>` | Custom pagination |
| Toast | `useToast()` | Custom notification |
| Icon | `<UIcon name="i-lucide-xxx">` | Inline SVG (kecuali brand) |
| Avatar | `<UAvatar>` | `<img class="rounded-full">` |
| Tooltip | `<UTooltip>` | Custom tooltip |
| Popover | `<UPopover>` | Custom popover |
| Alert | `<UAlert>` | Custom alert |
| Separator | `<USeparator>` | `<hr>` |
| Card | `<UCard>` | Custom card |
| Textarea | `<UTextarea>` | `<textarea>` |
| Checkbox | `<UCheckbox>` | `<input type="checkbox">` |
| Switch | `<USwitch>` | Custom toggle |
| Badge | `<UBadge>` | Custom badge span |
| Tabs | `<UTabs>` | Custom tabs |
| Breadcrumb | `<UBreadcrumb>` | Custom breadcrumb |
| Skeleton | `<USkeleton>` | Custom loading |

Daftar lengkap 125+ komponen: baca `docs/nuxtui-components.md`

### 3. Modal HARUS Component Terpisah

```
❌ SALAH:  Menulis modal inline di page
✅ BENAR:  Buat file di app/components/<feature>/AddModal.vue
           Lalu panggil: <FeatureAddModal v-model="showModal" @created="fetchData" />
```

### 4. DILARANG Menambah Library Tanpa Alasan Kuat

Jangan install package baru jika NuxtUI/Tailwind sudah bisa menangani kebutuhan tersebut.

### 5. DILARANG Hardcode Teks UI (Wajib i18n)

```
❌ SALAH:  <UButton>Save</UButton>
✅ BENAR:  <UButton>{{ $t('components.contact.addModal.save') }}</UButton>
```

Semua teks yang tampil ke user (label, placeholder, judul, toast, pesan validasi Zod, `aria-label`)
**WAJIB** lewat `$t()` (template) / `t()` dari `useI18n()` (script), dengan key ditambahkan ke
**KEDUA** `i18n/locales/en.json` dan `i18n/locales/id.json`.

Baca `docs/i18n-guide.md` untuk aturan lengkap SEBELUM menulis teks apapun di UI.

### 6. WAJIB Tandai `required` di UFormField untuk Field Wajib

```
❌ SALAH:  <UFormField :label="..." name="email">
✅ BENAR:  <UFormField :label="..." name="email" required>
```

Setiap `<UFormField>` untuk field yang wajib diisi di Zod schema (bukan `.optional()`/`.nullable()`) **WAJIB**
diberi atribut `required` (menampilkan tanda `*` otomatis). Field opsional (switch/toggle, atau field yang
eksplisit `.optional()`) **jangan** diberi `required`. Baca `docs/component-guide.md` §"Aturan: `required`
di UFormField" untuk detail & kasus khusus (mis. password opsional di update modal).

## Struktur Folder

```
app/
├── components/          # Auto-imported components
│   ├── BrandLogo.vue    # Global: logo + nama app
│   ├── Header.vue       # Global: page header (title, tabs, actions)
│   ├── Sidebar.vue      # Global: sidebar navigasi (collapsible)
│   ├── LanguageSwitcher.vue # Global: switch bahasa (di pojok kanan atas)
│   ├── UserPopover.vue  # Global: user profile dropdown
│   ├── DeleteModal.vue  # Global: generic delete confirmation
│   └── <feature>/       # Feature-specific components
│       ├── AddModal.vue      → <FeatureAddModal />
│       ├── UpdateModal.vue   → <FeatureUpdateModal />
│       └── DeleteModal.vue   → <FeatureDeleteModal /> (opsional)
├── composables/
│   ├── useAuth.ts       # Auth state (readonly)
│   ├── useNavigation.ts # Sidebar nav config (reaktif terhadap locale, lihat docs/i18n-guide.md)
│   └── error-helper.ts  # Global error handler
├── layouts/
│   ├── dashboard.vue    # Sidebar + main content
│   └── auth.vue         # Split-screen auth
├── middleware/
│   ├── auth.global.ts   # Protected route guard
│   └── guest.ts         # Guest-only route guard
├── pages/
│   ├── index.vue        # Dashboard (layout: dashboard)
│   ├── auth/            # Auth pages (layout: auth, middleware: guest)
│   └── <feature>/
│       └── index.vue    # CRUD listing page
├── plugins/
│   └── *.client.ts      # Client-only plugins (mis. restore locale, dsb.)
├── services/
│   ├── api-service.ts   # Axios base client + interceptors
│   ├── auth-service.ts  # Auth methods
│   └── <feature>-service.ts  # CRUD service
└── types/
    ├── auth.d.ts        # User, AuthData, ApiResponse
    └── <feature>.d.ts   # Feature types + payload

i18n/
└── locales/
    ├── en.json           # WAJIB sinkron dengan id.json (lihat docs/i18n-guide.md)
    └── id.json
```

## Design System

- **Primary**: green (`#009838`)
- **Error**: red (`#B91C1C`)
- **Warning**: yellow (`#D97706`)
- **Neutral**: slate
- **Font**: Geist (Google Fonts)
- **Button/Input default size**: `lg` (set di `app.config.ts`)

## Checklist: Menambah Fitur CRUD Baru

Saat diminta membuat fitur baru (contoh: `product`):

1. `app/types/product.d.ts` — Interface `Product` + `ProductPayload`
2. `app/services/product-service.ts` — Copy pattern dari `contact-service.ts`
3. `app/components/product/AddModal.vue` — Copy pattern dari `contact/AddModal.vue`
4. `app/components/product/UpdateModal.vue` — Copy pattern dari `contact/UpdateModal.vue`
5. `app/pages/product/index.vue` — Copy pattern dari `contact/index.vue`
6. `app/composables/useNavigation.ts` — Tambah nav item baru (pakai pola stable-id, lihat `docs/i18n-guide.md` §5)
7. `i18n/locales/en.json` **dan** `i18n/locales/id.json` — Tambah key untuk semua teks baru (lihat `docs/i18n-guide.md`)
8. `docs/changelog.md` — Catat perubahan
9. Gunakan `DeleteModal` global (jangan buat baru)

## Coding Conventions

| Aspek | Aturan |
|-------|--------|
| File pages | `kebab-case.vue` |
| File components | `PascalCase.vue` |
| File composables | `camelCase.ts` dengan prefix `use` |
| File services | `kebab-case-service.ts` |
| File types | `kebab-case.d.ts` |
| Variables | `camelCase` |
| Functions | `camelCase` prefix verb (`handleSubmit`, `fetchData`) |
| Interfaces/Types | `PascalCase` |
| Emits | past-tense (`created`, `updated`, `deleted`) |
| Indent | 2 spaces |
| Quotes | Single quotes |
| Trailing comma | Never |
| Import types | `import type { X } from '...'` |
| Package manager | `bun` (bukan npm/yarn) |
| Icons | `i-lucide-*` (bukan heroicons/dll) |

## Script Setup Order

```vue
<script setup lang="ts">
// 1. Imports
// 2. definePageMeta / defineModel / defineProps / defineEmits
// 3. Composables (useToast, useRoute, useAuth)
// 4. Reactive state (ref, reactive)
// 5. Computed
// 6. Zod schema
// 7. Functions/methods
// 8. Watchers
// 9. Lifecycle hooks (onMounted)
</script>
```

## File yang JANGAN Diubah (Kecuali Diminta)

- `app/services/api-service.ts` — Base HTTP client
- `app/services/auth-service.ts` — Auth flow
- `app/assets/css/main.css` — Design tokens
- `app/app.config.ts` — NuxtUI theme config
- `app/layouts/dashboard.vue` — Dashboard layout
- `app/layouts/auth.vue` — Auth layout
- `nuxt.config.ts` — Nuxt configuration

## Sebelum Membuat Pull Request / Commit

- Jalankan `bun run typecheck` dan `bun run lint` — pastikan tidak ada error baru yang ditambahkan
- Kalau ada teks UI baru: pastikan key sudah ada di `i18n/locales/en.json` **dan** `id.json`
- Update `docs/changelog.md` untuk perubahan yang berarti (fitur baru, breaking change)
- Jangan commit `.env`, credentials, atau file rahasia lainnya

## Dokumentasi Lengkap

Baca folder `docs/` untuk detail lebih lanjut:
- `docs/project-overview.md` — Arsitektur lengkap
- `docs/coding-standards.md` — Standar kode detail
- `docs/i18n-guide.md` — **WAJIB** — Aturan i18n (English/Indonesia) untuk semua teks UI
- `docs/nuxtui-guide.md` — Panduan NuxtUI + contoh kode
- `docs/nuxtui-components.md` — Daftar 125+ komponen NuxtUI
- `docs/component-guide.md` — Pattern modal, form, component
- `docs/service-layer.md` — Pattern service, API, types
- `docs/page-pattern.md` — Template halaman CRUD & auth
- `docs/changelog.md` — Log perubahan
