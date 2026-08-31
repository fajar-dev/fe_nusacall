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
      table-class="min-w-[720px]"
    >
      <template #actions>
        <UButton
          color="primary"
          @click="openCreate"
        >
          {{ $t('pages.contact.add') }}
        </UButton>
      </template>
    </DataTable>

    <ContactFormModal
      v-model:open="formOpen"
      :contact="selected"
      @saved="fetchContacts"
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

const UButton = resolveComponent('UButton')
const NuxtLink = resolveComponent('NuxtLink')
const { t } = useI18n()

const data = ref<Contact[]>([])
const isLoading = ref(false)
const formOpen = ref(false)
const selected = ref<Contact | null>(null)

const meta = reactive({ total: 0, from: 0, to: 0 })

async function fetchContacts() {
  isLoading.value = true
  try {
    const response = await contactService.getAll({
      page: page.value,
      limit: perPage.value,
      q: search.value,
      sortBy: sortBy.value || undefined,
      order: order.value
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

const { search, perPage, page, sortBy, order, sortHeader } = useTableQuery(fetchContacts)

function openCreate() {
  selected.value = null
  formOpen.value = true
}

function openEdit(contact: Contact) {
  selected.value = contact
  formOpen.value = true
}

const columns: TableColumn<Contact>[] = [
  {
    accessorKey: 'name',
    header: sortHeader(() => t('pages.contact.columnName'), 'name'),
    cell: ({ row }) => h(NuxtLink, {
      to: `/contact/${row.original.id}`,
      class: 'font-medium text-primary hover:underline'
    }, () => row.original.name || row.original.phoneNumber)
  },
  {
    accessorKey: 'phoneNumber',
    header: sortHeader(() => t('pages.contact.columnPhoneNumber'), 'phoneNumber')
  },
  {
    accessorKey: 'branch',
    header: sortHeader(() => t('pages.contact.columnBranch'), 'branch'),
    cell: ({ row }) => row.original.branch?.name || '—'
  },
  {
    id: 'actions',
    header: t('pages.contact.columnActions'),
    cell: ({ row }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-lucide-pencil',
        size: 'sm',
        onClick: () => openEdit(row.original)
      })
  }
]
</script>
