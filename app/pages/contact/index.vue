<template>
  <div class="space-y-6">
    <AppHeader
      :title="$t('pages.contact.title')"
      :description="$t('pages.contact.description')"
    />

    <DataTable
      v-model:search="search"
      v-model:page="page"
      v-model:per-page="perPage"
      :data="data"
      :columns="columns"
      :loading="isLoading"
      :total="meta.total"
      :from="meta.from"
      :to="meta.to"
      :search-placeholder="$t('pages.contact.searchPlaceholder')"
      table-class="min-w-[560px]"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { contactService } from '~/services/contact-service'
import type { Contact } from '~/types/contact'
import { formatRelative } from '~/utils/format'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()

const data = ref<Contact[]>([])
const isLoading = ref(false)

const meta = reactive({ total: 0, from: 0, to: 0 })

async function fetchContacts() {
  isLoading.value = true
  try {
    const response = await contactService.getAll({
      page: page.value,
      limit: perPage.value,
      q: search.value
    })
    if (response.success) {
      data.value = response.data
      if (response.meta) {
        meta.total = response.meta.total
        meta.from = response.meta.from
        meta.to = response.meta.to
      }
    }
  } finally {
    isLoading.value = false
  }
}

const { search, perPage, page } = useTableQuery(fetchContacts)

const columns: TableColumn<Contact>[] = [
  {
    accessorKey: 'profileName',
    header: t('pages.contact.columnProfileName'),
    cell: ({ row }) => row.original.profileName || '—'
  },
  {
    accessorKey: 'waId',
    header: t('pages.contact.columnWaId')
  },
  {
    accessorKey: 'createdAt',
    header: t('pages.contact.columnCreatedAt'),
    cell: ({ row }) => formatRelative(row.original.createdAt)
  }
]
</script>
