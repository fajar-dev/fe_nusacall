<template>
  <div class="space-y-6">
    <Header
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
      table-class="min-w-[640px]"
    />
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { contactService } from '~/services/contact-service'
import type { Contact } from '~/types/contact'

definePageMeta({
  layout: 'dashboard'
})

const UBadge = resolveComponent('UBadge')
const { t } = useI18n()

const data = ref<Contact[]>([])
const isLoading = ref(false)

const meta = reactive({ total: 0, from: 0, to: 0 })

async function fetchContacts() {
  isLoading.value = true
  try {
    const response = await contactService.getAll(page.value, perPage.value, search.value)
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

const { search, perPage, page, sortHeader } = useTableQuery(fetchContacts)

const columns: TableColumn<Contact>[] = [
  {
    accessorKey: 'name',
    header: sortHeader(() => t('pages.contact.columnName'), 'name'),
    cell: ({ row }) => {
      const name = row.original.name || t('pages.contact.unnamed')
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-highlighted' }, name),
        h('span', { class: 'text-xs text-muted' }, row.original.phoneNumber)
      ])
    }
  },
  {
    accessorKey: 'ownedByPhoneNumber',
    header: t('pages.contact.columnOwnedBy')
  },
  {
    accessorKey: 'isGroup',
    header: t('pages.contact.columnType'),
    cell: ({ row }) =>
      h(
        UBadge,
        { color: row.original.isGroup ? 'neutral' : 'primary', variant: 'subtle' },
        () => t(row.original.isGroup ? 'pages.contact.group' : 'pages.contact.individual')
      )
  }
]
</script>
