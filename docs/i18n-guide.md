# 🌐 i18n Guide (English / Bahasa Indonesia)

> **WAJIB DIBACA** oleh AI agent sebelum menambah atau mengubah teks apapun yang tampil di UI.
> Project ini mendukung 2 bahasa: **English (`en`)** dan **Bahasa Indonesia (`id`)** via `@nuxtjs/i18n`.

## ⛔ Aturan #0 (Paling Penting)

> **DILARANG KERAS hardcode teks yang tampil ke user** — baik di `<template>` maupun `<script>`.
> Setiap label, placeholder, judul, deskripsi, pesan toast, pesan validasi Zod, dan `aria-label` HARUS lewat i18n.

```vue
<!-- ❌ SALAH -->
<UButton>Save</UButton>
<h1>Add Contact</h1>

<!-- ✅ BENAR -->
<UButton>{{ $t('components.contact.addModal.save') }}</UButton>
<h1>{{ $t('components.contact.addModal.title') }}</h1>
```

Pengecualian (boleh hardcode) — lihat [§7 Apa yang TIDAK Perlu Diterjemahkan](#7-apa-yang-tidak-perlu-diterjemahkan).

## 1. Stack & Konfigurasi

| Hal | Detail |
|-----|--------|
| Module | `@nuxtjs/i18n` (`^10.6.0`) |
| Locale tersedia | `en` (English), `id` (Bahasa Indonesia) |
| Config | `nuxt.config.ts` → key `i18n` |
| File locale | `i18n/locales/en.json`, `i18n/locales/id.json` (**di root project, BUKAN di `app/`**) |
| Strategy | `no_prefix` — tidak ada prefix locale di URL (`/contact`, bukan `/en/contact`) |
| SSR | Disabled (`ssr: false`) — semua i18n berjalan client-side |

Cek isi `i18n` block di `nuxt.config.ts` untuk detail persis (locale codes, default locale, mekanisme deteksi/persist bahasa) — **jangan asumsikan**, baca konfigurasi aktual karena bisa berubah.

## 2. Lokasi & Struktur File Locale

```
i18n/
└── locales/
    ├── en.json
    └── id.json
```

Kedua file **WAJIB punya key shape yang identik** — hanya value (teks) yang beda. Jangan pernah menambah key ke satu file tanpa menambah key yang sama persis ke file satunya.

### Struktur Top-Level (WAJIB)

Root JSON hanya punya 2 top-level key:

```json
{
  "components": { ... },
  "pages": { ... }
}
```

**Aturan penempatan:**

| Sumber teks | Masuk ke | Contoh path key |
|-------------|----------|------------------|
| File di `app/components/<File>.vue` | `components.<camelCaseFileName>.*` | `components.header.openMenu` |
| File di `app/components/<feature>/<File>.vue` | `components.<feature>.<camelCaseFileName>.*` | `components.contact.addModal.title` |
| File di `app/pages/<file>.vue` | `pages.<camelCaseFileName>.*` | `pages.dashboard.title` |
| File di `app/pages/<feature>/<file>.vue` | `pages.<feature>.<camelCaseFileName>.*` | `pages.contact.title`, `pages.auth.signIn.title` |
| File di `app/pages/<feature>/index.vue` | `pages.<feature>.*` (tanpa sub-key `index`) | `pages.contact.title` |
| File di `app/pages/profile/information.vue` (nested, bukan index) | `pages.profile.information.*` | `pages.profile.information.save` |

Key di dalam tiap section pakai **camelCase**, deskriptif berdasarkan fungsi elemen (`nameLabel`, `nameRequired`, `emailPlaceholder`, `deletedSuccess`) — bukan berdasarkan isi teks literal.

### Contoh Lengkap (mengikuti pattern `contact` feature)

```json
// i18n/locales/en.json
{
  "components": {
    "contact": {
      "addModal": {
        "title": "Add Contact",
        "nameLabel": "Name",
        "namePlaceholder": "Enter name",
        "nameRequired": "Name is required",
        "save": "Save",
        "createdSuccess": "Contact created successfully!"
      }
    }
  },
  "pages": {
    "contact": {
      "title": "Contact Customer",
      "addContact": "Add Contact",
      "columnName": "Name"
    }
  }
}
```

```json
// i18n/locales/id.json — SAMA PERSIS strukturnya
{
  "components": {
    "contact": {
      "addModal": {
        "title": "Tambah Kontak",
        "nameLabel": "Nama",
        "namePlaceholder": "Masukkan nama",
        "nameRequired": "Nama wajib diisi",
        "save": "Simpan",
        "createdSuccess": "Kontak berhasil dibuat!"
      }
    }
  },
  "pages": {
    "contact": {
      "title": "Kontak Pelanggan",
      "addContact": "Tambah Kontak",
      "columnName": "Nama"
    }
  }
}
```

## 3. Cara Pakai di Kode

### Di `<template>`

Gunakan `$t('key.path')` — global helper, tidak perlu import:

```vue
<UButton>{{ $t('components.contact.addModal.save') }}</UButton>
<UFormField :label="$t('components.contact.addModal.nameLabel')">
  <UInput :placeholder="$t('components.contact.addModal.namePlaceholder')" />
</UFormField>
<UButton :aria-label="$t('components.header.openMenu')" icon="i-lucide-menu" />
```

### Di `<script setup>`

`$t` **tidak tersedia** di script. Ambil `t` dari `useI18n()`:

```typescript
const { t } = useI18n()

// Toast
toast.add({
  title: t('components.contact.addModal.createdSuccess'),
  color: 'success',
  icon: 'i-lucide-circle-check'
})

// Zod schema — pesan error WAJIB via t()
const schema = z.object({
  name: z.string().min(1, t('components.contact.addModal.nameRequired')),
  email: z.string().min(1, t('components.contact.addModal.emailRequired'))
    .email(t('components.contact.addModal.emailInvalid'))
})

// useHead (page title tab browser)
useHead({ title: t('pages.auth.signIn.title') })

// TableColumn header (render function, bukan string statis)
const columns: TableColumn<Contact>[] = [
  { accessorKey: 'name', header: () => t('pages.contact.columnName') }
]
```

> ⚠️ **Skema Zod dibuat sekali saat `setup()` berjalan.** Pesan error ter-lock ke locale saat komponen mount. Ini trade-off yang **diterima** di project ini (konsisten dengan pattern yang sudah ada) — jangan over-engineer dengan `computed()` schema kecuali diminta eksplisit.

### Interpolasi (variabel di dalam teks)

```json
// locale file
{ "showingResults": "Showing {from} to {to} of {total} results" }
```

```vue
{{ $t('pages.contact.showingResults', { from: meta.from, to: meta.to, total: meta.total }) }}
```

```typescript
t('components.notificationPopover.newBadge', { count: unreadCount.value })
```

## 4. Language Switcher

Component: `app/components/LanguageSwitcher.vue` (global, auto-imported).

- Sudah dipasang di **kanan atas**: `Header.vue` (dashboard, mobile + desktop) dan `auth.vue` layout (halaman sign-in/forgot/reset-password).
- **Jangan buat switcher baru** — pakai `<LanguageSwitcher />` yang sudah ada jika butuh menambah lokasi baru.
- Ganti bahasa lewat `useI18n().setLocale(code)` — **jangan** `locale.value = code` langsung (bisa skip proses async load pesan locale target).
- Icon HARUS dari set `@iconify-json/lucide` (prefix `i-lucide-*`) sesuai aturan project. **Jangan** referensikan icon set lain (mis. `circle-flags:*`) — package-nya tidak terpasang dan akan gagal render.
- Komponen dropdown pakai `<UDropdownMenu>` — **`UIconMenu` tidak ada** di NuxtUI, jangan pernah pakai.
- Label pilihan bahasa ("English", "Bahasa Indonesia") **tidak diterjemahkan** — nama bahasa selalu ditampilkan dalam bahasa aslinya (native name), ini pengecualian yang disengaja.

## 5. Sidebar / Navigasi — Pola Wajib (Stable ID)

`app/composables/useNavigation.ts` dan `app/components/Sidebar.vue` adalah kasus khusus yang **wajib diikuti persis** kalau menambah nav item baru:

1. `navGroups` dan `bottomNavItems` **HARUS** berupa `computed(() => [...])`, **bukan** array statis biasa. Array statis dibuat sekali saat komponen mount dan **tidak akan reaktif** terhadap pergantian bahasa.
2. Setiap `NavGroup` (yang punya `title`) dan setiap `NavItem` yang punya `children` **WAJIB** diberi `id` string stabil (bahasa Inggris, tidak berubah), terpisah dari `label` yang terjemahannya berubah sesuai locale.
3. State expand/collapse (`toggleExpanded`, `isExpanded`) dan `:key` di `v-for` **HARUS** pakai `id`, **BUKAN** `label`/`title`. Kalau pakai teks yang diterjemahkan sebagai key/identity, submenu yang sedang terbuka akan collapse/reset saat user ganti bahasa.

```typescript
// ✅ BENAR
{
  id: 'pmr',                                    // stabil, tidak berubah
  label: t('components.sidebar.nav.pmr'),       // berubah sesuai locale
  children: [
    { id: 'pmrMula', label: t('components.sidebar.nav.mula'), to: '#' }
  ]
}
```

```vue
<!-- Sidebar.vue -->
<div v-for="group in navGroups" :key="group.id || group.title">
<template v-for="item in group.items" :key="item.id">
@click="() => { toggleExpanded(item.id) }"
```

Tambah nav item baru = tambah entry di `t('components.sidebar.nav.<key>')` (di kedua locale file) + tambah node di `navGroups`/`bottomNavItems` dengan `id` baru yang unik.

## 6. Persistensi Bahasa

Cek `nuxt.config.ts` → `i18n.detectBrowserLanguage` untuk mekanisme aktual (cookie atau custom `localStorage` plugin di `app/plugins/`). **Jangan asumsikan salah satu** — baca config-nya langsung, karena ini bagian yang paling sering di-tweak. Yang **tidak boleh berubah** tanpa alasan kuat:

- Bahasa pilihan user harus bertahan setelah **full page reload**.
- Bahasa pilihan user harus bertahan saat **pindah halaman**.

## 7. Apa yang TIDAK Perlu Diterjemahkan

- Nama brand: `SIAMO`, `PMI`, `Palang Merah Indonesia`
- Nama bahasa di `LanguageSwitcher` ("English", "Bahasa Indonesia")
- Data mock/dummy untuk demo (misal isi notifikasi contoh di `NotificationPopover.vue`) — ini bukan UI chrome, hanya sample data
- Nilai teknis: nama field form (`name="email"`), `id` HTML, class Tailwind, nama icon (`i-lucide-*`)

## 8. Checklist — Setiap Kali Menambah Fitur / Halaman / Komponen Baru

```
[ ] 1. Semua teks statis di <template> pakai $t('...')
[ ] 2. Semua teks di <script> (toast, Zod message, useHead, table header) pakai t('...') dari useI18n()
[ ] 3. aria-label yang berisi kata-kata (bukan cuma nama teknis) juga diterjemahkan
[ ] 4. Key baru ditambahkan ke KEDUA i18n/locales/en.json dan i18n/locales/id.json, shape identik
[ ] 5. Key masuk ke "components.<...>" atau "pages.<...>" sesuai lokasi file (§2)
[ ] 6. Kalau menambah nav item → ikuti pola stable-id di §5, JANGAN pakai array statis / label sebagai key
[ ] 7. Kalau butuh variabel dalam teks → pakai interpolasi {namaVar}, bukan template string manual
[ ] 8. Test switch bahasa di browser — pastikan tidak ada teks literal "pages.xxx.yyy" muncul (artinya key belum ada di salah satu file locale)
```

## 9. Kesalahan Umum (Sudah Pernah Terjadi — Jangan Diulang)

| Kesalahan | Akibat | Solusi |
|-----------|--------|--------|
| Key ditambahkan cuma di satu locale file | Teks fallback ke key literal (`pages.contact.title` tampil apa adanya) di locale yang belum punya key | Selalu tambah ke **kedua** file, sekaligus |
| `locale.value = 'id'` langsung (bukan `setLocale()`) | Pesan locale baru belum ter-load, UI stuck di key literal walau locale sudah pindah | Selalu pakai `await setLocale(code)` |
| Nav array statis (bukan `computed()`) | Sidebar tidak berubah bahasa saat switch locale tanpa reload manual | Bungkus dengan `computed(() => [...])` |
| Pakai `label`/`title` (teks) sebagai `:key` atau identity untuk expand-state | Submenu collapse/reset saat ganti bahasa | Tambah field `id` stabil, pakai itu untuk key & state |
| Menambah module i18n baru tapi dev server tidak di-restart | Locale file baru tidak ke-load (`Not found 'xxx' key in 'id' locale messages`), tidak ada error jelas | Registrasi module/locale file baru selalu butuh **restart penuh** dev server, bukan cuma HMR |
| Referensi icon set yang tidak terpasang (`circle-flags:*`) atau komponen yang tidak ada (`UIconMenu`) | Icon tidak render / component resolve error | Selalu cek `@iconify-json/lucide` tersedia; pakai `UDropdownMenu`, bukan `UIconMenu` |

## 10. Referensi File Nyata (Contoh yang Sudah Benar)

| Kebutuhan | Contoh File |
|-----------|-------------|
| Halaman CRUD lengkap dengan i18n | `app/pages/contact/index.vue` |
| Modal Add/Update dengan Zod + i18n | `app/components/contact/AddModal.vue`, `app/components/contact/UpdateModal.vue` |
| Halaman auth dengan i18n | `app/pages/auth/sign-in.vue` |
| Sidebar dengan pola stable-id | `app/composables/useNavigation.ts` + `app/components/Sidebar.vue` |
| Language switcher | `app/components/LanguageSwitcher.vue` |
| Struktur locale file | `i18n/locales/en.json` + `i18n/locales/id.json` |
