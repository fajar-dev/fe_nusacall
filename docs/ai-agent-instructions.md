# 🤖 AI Agent Instructions

> **File ini HARUS dibaca oleh AI agent sebelum melakukan perubahan apapun di project ini.**
> Ringkasan aturan paling kritis juga ada di root project: `AGENTS.md` (semua AI coding agent) /
> `CLAUDE.md` (khusus Claude Code, auto-loaded). Baca salah satunya duluan kalau belum.

## Langkah Pertama: Baca Dokumentasi

Sebelum menulis kode apapun, baca file-file ini secara berurutan:

0. **[../AGENTS.md](../AGENTS.md)** (atau **[../CLAUDE.md](../CLAUDE.md)** untuk Claude Code) — Ringkasan aturan kritis, dibaca duluan
1. **[README.md](./README.md)** — Overview & aturan utama
2. **[coding-standards.md](./coding-standards.md)** — Larangan & standar kode
3. **[i18n-guide.md](./i18n-guide.md)** — Aturan i18n (English/Indonesia) — **WAJIB kalau menulis teks UI apapun**
4. **[nuxtui-guide.md](./nuxtui-guide.md)** — Komponen NuxtUI yang tersedia
5. **[component-guide.md](./component-guide.md)** — Pattern component & modal
6. **[service-layer.md](./service-layer.md)** — Pattern service & API
7. **[page-pattern.md](./page-pattern.md)** — Pattern halaman

## Aturan Kritis (JANGAN DILANGGAR)

### 1. DILARANG Hardcode CSS Values

```
❌ px-[10px], m-[5px], w-[200px], h-[50vh], text-[14px], max-w-[420px]
✅ px-2.5, m-1, w-52, h-screen, text-sm, max-w-md
```

### 2. WAJIB Gunakan NuxtUI

- Button → `<UButton>` (bukan `<button>`)
- Input → `<UInput>` (bukan `<input>`)
- Form → `<UForm>` + `<UFormField>` (bukan custom)
- Modal → `<UModal>` (bukan custom modal)
- Table → `<UTable>` (bukan custom table)
- Dropdown → `<UDropdownMenu>` (bukan custom)
- Pagination → `<UPagination>` (bukan custom)
- Toast → `useToast()` (bukan custom notification)
- Icon → `<UIcon name="i-lucide-xxx">` (bukan inline SVG, kecuali brand icon)

### 3. WAJIB i18n untuk Semua Teks UI

```vue
<!-- ❌ SALAH -->
<UButton>Save</UButton>

<!-- ✅ BENAR -->
<UButton>{{ $t('components.contact.addModal.save') }}</UButton>
```

- Semua teks (label, placeholder, toast, pesan Zod, `aria-label`) lewat `$t()` / `t()` dari `useI18n()`
- Key WAJIB ditambahkan ke **KEDUA** `i18n/locales/en.json` dan `i18n/locales/id.json`
- Baca **[i18n-guide.md](./i18n-guide.md)** SEBELUM menulis teks UI apapun

### 4. Modal HARUS Component Terpisah

- Buat di `app/components/<feature>/`
- Contoh: `app/components/product/AddModal.vue`
- Jangan tulis modal inline di page

### 5. Ikuti Pattern yang Ada

- **Service**: Copy pattern dari `contact-service.ts`
- **Types**: Copy pattern dari `contact.d.ts`
- **Page CRUD**: Copy pattern dari `pages/contact/index.vue`
- **Add Modal**: Copy pattern dari `components/contact/AddModal.vue`
- **Update Modal**: Copy pattern dari `components/contact/UpdateModal.vue`
- **Delete**: Gunakan `DeleteModal` global

### 6. Script Setup Order

```
1. Imports
2. definePageMeta / defineModel / defineProps / defineEmits
3. Composables (useToast, useRoute, dll)
4. Reactive state
5. Computed
6. Schema (Zod)
7. Functions
8. Watchers
9. Lifecycle hooks
```

## Checklist: Menambah Fitur CRUD Baru

Saat AI agent diminta membuat fitur CRUD baru (misal: `product`):

```
[ ] 1. Buat type:       app/types/product.d.ts
[ ] 2. Buat service:    app/services/product-service.ts
[ ] 3. Buat component:  app/components/product/AddModal.vue
[ ] 4. Buat component:  app/components/product/UpdateModal.vue
[ ] 5. Buat page:       app/pages/product/index.vue
[ ] 6. Update navigasi: app/composables/useNavigation.ts (tambah nav item, pola stable-id — lihat i18n-guide.md §5)
[ ] 7. Update i18n:     i18n/locales/en.json DAN id.json (semua teks baru, key shape identik)
[ ] 8. Update docs:     docs/changelog.md (catat perubahan)
```

## Referensi File yang Sudah Ada

| Tipe | File Referensi | Gunakan Sebagai Template |
|------|---------------|-------------------------|
| Type definition | `app/types/contact.d.ts` | ✅ |
| Service class | `app/services/contact-service.ts` | ✅ |
| Add Modal | `app/components/contact/AddModal.vue` | ✅ |
| Update Modal | `app/components/contact/UpdateModal.vue` | ✅ |
| CRUD Page | `app/pages/contact/index.vue` | ✅ |
| Auth Page | `app/pages/auth/sign-in.vue` | ✅ |
| Delete Modal | `app/components/DeleteModal.vue` | ❌ Gunakan langsung, jangan buat baru |
| Sidebar Nav | `app/composables/useNavigation.ts` | Tambah item di sini (pola stable-id) |
| Language Switcher | `app/components/LanguageSwitcher.vue` | ❌ Gunakan langsung, jangan buat baru |
| Locale files | `i18n/locales/en.json` + `id.json` | Tambah key di sini untuk teks baru |

## Konvensi Penting

| Aspek | Aturan |
|-------|--------|
| Bahasa kode | English (variable, function, class) |
| Bahasa UI | **WAJIB i18n** — English (`en`) + Indonesia (`id`), lihat `i18n-guide.md` |
| Bahasa toast/pesan Zod | **WAJIB i18n** — lewat `t()`, bukan string hardcode |
| Indent | 2 spaces |
| Quote | Single quotes |
| Trailing comma | NEVER |
| File extension | `.vue` (component/page), `.ts` (logic), `.d.ts` (types) |
| CSS arbitrary | **DILARANG** |
| Package manager | `bun` (bukan npm/yarn) |
| Icons | `i-lucide-*` prefix (bukan heroicons/dll) |

## Yang TIDAK Perlu Dilakukan

- ❌ Jangan tambah library baru tanpa alasan kuat
- ❌ Jangan ubah `api-service.ts` (kecuali menambah interceptor)
- ❌ Jangan ubah `auth-service.ts` (kecuali menambah auth method)
- ❌ Jangan ubah design token di `main.css` (kecuali diminta)
- ❌ Jangan ubah `app.config.ts` (kecuali menambah default variant baru)
- ❌ Jangan ubah layout files (kecuali diminta secara spesifik)
- ❌ Jangan menulis CSS custom jika bisa pakai Tailwind utility
- ❌ Jangan membuat custom form validation jika bisa pakai Zod + UForm
