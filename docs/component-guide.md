# 🧩 Component Guide

## Prinsip Dasar

1. **Reusability** — Komponen harus bisa dipakai ulang di berbagai konteks
2. **Single Responsibility** — Satu komponen, satu tanggung jawab
3. **Props Down, Events Up** — Data mengalir ke bawah via props, perubahan dikomunikasikan via emit
4. **Modal = Component** — Semua modal, dialog, dan popup **HARUS** dijadikan component terpisah, BUKAN ditulis inline di page
5. **Dark mode via semantic tokens, BUKAN class `dark:`** — App ini support dark mode (toggle: `UColorModeButton`, `useColorMode()` dari `@nuxtjs/color-mode`). JANGAN hardcode warna neutral/white (`bg-white`, `text-neutral-900`, `border-neutral-200`, dst) — pakai token semantik NuxtUI yang otomatis adaptif ke dark mode:
   - Background: `bg-default` (putih/neutral-900), `bg-muted` (neutral-50/neutral-800), `bg-elevated`, `bg-accented`
   - Text: `text-highlighted` (judul/neutral-900), `text-toned`, `text-default`, `text-muted`, `text-dimmed` (paling redup)
   - Border/ring: `border-default`, `border-muted`, `border-accented`, `ring-default`, `ring-muted`
   - Warna aksen (`bg-emerald-500/10`, dsb) pakai shade mid + opacity (`/10`), BUKAN shade `-50`/`-100` solid — shade terang solid nyaris tak terlihat di background gelap
   - Aset gambar dengan teks/warna solid (mis. logo) butuh 2 versi file (light/dark) di-switch via `useColorMode()` — lihat `BrandLogo.vue`
   - Pengecualian: warna literal (`text-white`, `bg-black/40`) tetap boleh dipakai kalau elemennya duduk di atas background yang SELALU gelap terlepas dari tema (contoh: overlay foto) — di situ warna TIDAK boleh ikut flip ke token semantik

## Kategori Komponen

### 1. Global Components (`app/components/`)

Komponen yang digunakan di seluruh aplikasi. Auto-imported oleh Nuxt.

| Komponen | Fungsi | Props | Emits |
|----------|--------|-------|-------|
| `BrandLogo` | Logo + nama aplikasi (2 versi asset: `logo-with-text.png` light, `logo-with-text-dark.png` dark) | `isCollapsed?: boolean` | — |
| `Header` | Page header: title, description, tabs, actions, mobile nav | `title: string`, `description?: string` | — |
| `Sidebar` | Navigasi sidebar (collapsible, responsive, i18n-aware) | — | — |
| `LanguageSwitcher` | Switch bahasa (English/Indonesia) | — | — |
| `UColorModeButton` | Toggle dark/light mode (built-in NuxtUI, taruh selalu di sebelah kiri `LanguageSwitcher`) | `variant?` (pakai `"soft"` biar konsisten) | — |
| `UserPopover` | User profile dropdown + logout | `popoverProps?: Record<string, any>` | — |
| `DeleteModal` | Generic delete confirmation modal | `title?: string`, `itemName?: string`, `loading?: boolean` | `confirm` |
| `DataTable` | Generic list table: search, per-page, sortable headers (via `useTableQuery`), pagination, `#filters`/`#actions`/`#expanded` slots | `columns`, `data`, `loading?`, `total?`, `from?`, `to?`, `searchPlaceholder?`, `limitOptions?`, `tableClass?` (+ `v-model` untuk `search`/`page`/`perPage`/`expanded`) | — |

> ⚠️ **Semua teks di atas (title, description, label toast, dsb.) di kode asli lewat `$t()`, bukan string statis.** Lihat [i18n-guide.md](./i18n-guide.md). Contoh kode di bawah ini disederhanakan pakai teks polos agar mudah dibaca — saat implementasi nyata, **ganti semua teks dengan `$t('...')` / `t('...')`**.

### 2. Feature Components (`app/components/<feature>/`)

Komponen spesifik untuk fitur tertentu. Dinamakan dengan prefix folder.

**Contoh: `contact/`**

| Komponen | Fungsi | Props | Emits |
|----------|--------|-------|-------|
| `ContactAddModal` | Form tambah contact | `modelValue: boolean` (v-model) | `created` |
| `ContactUpdateModal` | Form edit contact | `modelValue: boolean`, `contact: Contact \| null` | `updated` |
| `ContactDeleteModal` | Konfirmasi hapus contact | `modelValue: boolean`, `contact: Contact \| null` | `deleted` |

> **Auto-naming oleh Nuxt:** File `components/contact/AddModal.vue` otomatis jadi `<ContactAddModal />`.

## Aturan Wajib: Modal HARUS Jadi Component

### ❌ SALAH — Modal ditulis inline di page

```vue
<!-- pages/product/index.vue -->
<template>
  <div>
    <!-- ... page content ... -->
    
    <!-- ❌ JANGAN tulis modal langsung di page -->
    <UModal v-model:open="showAdd">
      <template #body>
        <UForm ...>
          <!-- 50+ baris form code -->
        </UForm>
      </template>
    </UModal>
  </div>
</template>
```

### ✅ BENAR — Modal dijadikan component terpisah

```vue
<!-- components/product/AddModal.vue -->
<template>
  <UModal ...>
    <!-- Modal content -->
  </UModal>
</template>

<!-- pages/product/index.vue -->
<template>
  <div>
    <!-- ... page content ... -->
    <ProductAddModal v-model="showAdd" @created="fetchProducts" />
  </div>
</template>
```

## Pattern: Add Modal Component

> Key i18n di bawah ini contoh untuk feature `[feature]` — sesuaikan namespace-nya
> (`components.[feature].addModal.*`) dan tambahkan ke **kedua** `i18n/locales/en.json` & `id.json`.
>
> **Field required:** kalau field itu wajib di Zod schema (tidak `.optional()`/`.nullable()`), `<UFormField>`-nya **WAJIB** diberi atribut `required` — ini yang menampilkan tanda `*` di label. Field opsional (switch/toggle, select dengan default, atau field yang eksplisit `.optional()`) **tidak** diberi `required`. Lihat §"Aturan: `required` di UFormField" di bawah.

```vue
<template>
  <UModal
    :title="$t('components.[feature].addModal.title')"
    :description="$t('components.[feature].addModal.description')"
    v-model:open="open"
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="add-[feature]-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-2">
        <UFormField :label="$t('components.[feature].addModal.fieldNameLabel')" name="fieldName" required>
          <UInput v-model="form.fieldName" :placeholder="$t('components.[feature].addModal.fieldNamePlaceholder')" class="w-full" />
        </UFormField>
        <!-- More fields -->
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('components.[feature].addModal.cancel')" @click="open = false" color="neutral" variant="outline" />
        <UButton
          type="submit"
          form="add-[feature]-form"
          color="primary"
          :loading="isSubmitting"
        >
          {{ $t('components.[feature].addModal.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { featureService } from '~/services/[feature]-service'
import type { FeaturePayload } from '~/types/[feature]'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)
const { t } = useI18n()

const schema = z.object({
  fieldName: z.string().min(1, t('components.[feature].addModal.fieldNameRequired'))
})

const form = reactive<FeaturePayload>({
  fieldName: ''
})

const resetForm = () => {
  form.fieldName = ''
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await featureService.create(form)
    if (response.success) {
      toast.add({
        title: t('components.[feature].addModal.createdSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('created')
      open.value = false
      resetForm()
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (!val) resetForm()
})
</script>
```

## Aturan: `required` di UFormField

Setiap `<UFormField>` untuk field yang **wajib diisi** di Zod schema (bukan `.optional()`/`.nullable()`, tanpa fallback `.or(z.literal(''))`) **WAJIB** diberi atribut `required`. NuxtUI otomatis menampilkan tanda `*` di label saat atribut ini ada — jangan tambahkan tanda `*` manual ke teks label.

```vue
<!-- ✅ BENAR — field wajib di schema, UFormField diberi required -->
<UFormField :label="$t('components.contact.addModal.emailLabel')" name="email" required>
  <UInput v-model="form.email" ... />
</UFormField>

<!-- ✅ BENAR — field opsional di schema, TIDAK diberi required -->
<UFormField :label="$t('components.contact.addModal.salutationLabel')" name="salutation">
  <USelect v-model="form.salutation" ... />
</UFormField>
```

```typescript
const schema = z.object({
  email: z.string().min(1, t('...')),                    // wajib → required di UFormField
  salutation: z.enum(['mr', 'mrs']).nullable().optional(), // opsional → JANGAN required
  oldPassword: z.string().optional().or(z.literal('')),    // opsional → JANGAN required
})
```

**Kasus khusus:**
- Field boolean via `USwitch`/`UCheckbox` (mis. status aktif/nonaktif) — jangan diberi `required`, selalu punya nilai default.
- Field select dengan default value (mis. `type` dengan default `customer`) tapi **wajib** di schema (tidak `.optional()`) — tetap diberi `required`, karena aturannya berdasarkan schema, bukan ada/tidaknya default.
- Update modal yang field-nya jadi opsional (mis. password "kosongkan jika tidak diubah") — **jangan** ikut pola Add modal-nya begitu saja, cek schema update-nya masing-masing.

## Pattern: Update Modal Component

```vue
<template>
  <UModal
    :title="$t('components.[feature].updateModal.title')"
    :description="$t('components.[feature].updateModal.description')"
    v-model:open="open"
    :ui="{
      content: 'sm:max-w-md',
      overlay: 'bg-black/40',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <UForm id="update-[feature]-form" :schema="schema" :state="form" @submit="handleSubmit" class="space-y-2">
        <!-- Same fields as Add (namespace components.[feature].updateModal), populated from props.item -->
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton :label="$t('components.[feature].updateModal.cancel')" @click="open = false" color="neutral" variant="outline" />
        <UButton type="submit" form="update-[feature]-form" color="primary" :loading="isSubmitting">
          {{ $t('components.[feature].updateModal.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { featureService } from '~/services/[feature]-service'
import type { Feature, FeaturePayload } from '~/types/[feature]'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  [feature]: Feature | null       // Data item yang akan di-edit
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()
const isSubmitting = ref(false)
const { t } = useI18n()

// Schema (namespace terpisah dari Add: components.[feature].updateModal.*)
const schema = z.object({ /* z.string().min(1, t('components.[feature].updateModal.fieldNameRequired')) */ })

const form = reactive<FeaturePayload>({ /* ... */ })

// Populate form saat modal dibuka
const populateForm = () => {
  if (props.[feature]) {
    form.fieldName = props.[feature].fieldName
    // ... populate semua field
  }
}

const handleSubmit = async () => {
  if (!props.[feature]) return
  isSubmitting.value = true
  try {
    const response = await featureService.update(props.[feature].id, form)
    if (response.success) {
      toast.add({
        title: t('components.[feature].updateModal.updatedSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('updated')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

// Watch: populate saat modal open
watch(open, (val) => {
  if (val) populateForm()
})
</script>
```

## Pattern: Menggunakan Generic DeleteModal

Untuk delete, **gunakan DeleteModal global** bukan buat baru:

```vue
<!-- Di page -->
<DeleteModal
  v-model="showDeleteModal"
  :title="$t('pages.[feature].deleteTitle')"
  :item-name="selectedItem?.name"
  :loading="isDeleting"
  @confirm="handleDelete"
/>
```

```typescript
// Handler di page
const { t } = useI18n()

const handleDelete = async () => {
  if (!selectedItem.value) return
  isDeleting.value = true
  try {
    const response = await featureService.delete(selectedItem.value.id)
    if (response.success) {
      toast.add({
        title: t('pages.[feature].deletedSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchItems()
  } finally {
    isDeleting.value = false
  }
}
```

> `DeleteModal` sendiri sudah punya default title/description via i18n (`components.deleteModal.*`) — kirim `:title` custom hanya kalau perlu override, seperti contoh di atas.

## Pattern: Header Component

Digunakan di setiap dashboard page sebagai header pertama:

```vue
<Header
  :title="$t('pages.[feature].title')"
  :description="$t('pages.[feature].description')"
>
  <!-- Optional: Tab navigation -->
  <template #tabs>
    <NuxtLink to="/feature" class="...">Tab 1</NuxtLink>
    <NuxtLink to="/feature/other" class="...">Tab 2</NuxtLink>
  </template>

  <!-- Optional: Action buttons -->
  <template #actions>
    <UButton icon="i-lucide-download">Export</UButton>
  </template>
</Header>
```

## Checklist Membuat Feature Component Baru

Saat menambah fitur CRUD baru (misal: `product`):

1. **Types**: Buat `app/types/product.d.ts`
   - Interface `Product` (data dari API)
   - Interface `ProductPayload` (payload create/update)

2. **Service**: Buat `app/services/product-service.ts`
   - Class `ProductService` mengikuti pattern `ContactService`
   - Export singleton: `export const productService = new ProductService()`

3. **Components**: Buat folder `app/components/product/`
   - `AddModal.vue` — Form create
   - `UpdateModal.vue` — Form update
   - Gunakan `DeleteModal` global (jangan buat baru)

4. **Page**: Buat `app/pages/product/index.vue`
   - Mengikuti pattern `contact/index.vue`

5. **Navigation**: Update `app/composables/useNavigation.ts`
   - Tambahkan nav item baru di `navGroups`, pakai pola stable-`id` (lihat [i18n-guide.md](./i18n-guide.md) §5)

6. **i18n**: Tambahkan semua key teks baru ke `i18n/locales/en.json` **dan** `id.json`
   - Namespace: `components.product.*` (modal) dan `pages.product.*` (page) — lihat [i18n-guide.md](./i18n-guide.md)

## v-model Pattern untuk Modal

Semua modal menggunakan `defineModel` untuk two-way binding:

```vue
<!-- Component -->
<script setup>
const open = defineModel<boolean>({ default: false })
</script>

<!-- Parent -->
<ComponentModal v-model="showModal" />
```

## Slot Pattern

| Komponen | Slot | Fungsi |
|----------|------|--------|
| `Header` | `#tabs` | Tab navigation links |
| `Header` | `#actions` | Action buttons (filter, export, dll) |
| `DeleteModal` | `#description` | Custom delete message |
| `UModal` | `#body` | Modal body content |
| `UModal` | `#footer` | Modal footer (action buttons) |
| `UModal` | `#content` | Full custom modal content |
| `UInput` | `#trailing` | Trailing element (password toggle) |
| `UFormField` | `#hint` | Hint text/link |
| `UserPopover` | `default` | Custom trigger element |
| `UPopover` | `#content` | Popover body |
