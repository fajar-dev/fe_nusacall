<template>
    <div class="space-y-6">
        <!-- Header -->
        <Header
          :title="$t('pages.contact.title')"
          :description="$t('pages.contact.description')"
        >
        </Header>

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
          table-class="min-w-[768px]"
        >
          <template #actions>
            <UButton
                color="primary"
                variant="solid"
                icon="i-lucide-plus-circle"
                class="w-full sm:w-auto justify-center"
                @click="() => { showAddModal = true }"
            >
                {{ $t('pages.contact.addContact') }}
            </UButton>
          </template>
        </DataTable>

        <!-- Modals -->
        <ContactAddModal v-model="showAddModal" @created="fetchContacts" />
        <ContactUpdateModal v-model="showUpdateModal" :contact="selectedContact" @updated="fetchContacts" />
        <DeleteModal
          v-model="showDeleteModal"
          :title="$t('pages.contact.deleteTitle')"
          :item-name="selectedContact?.name"
          :loading="isDeleting"
          @confirm="handleDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'
import { contactService } from '~/services/contact-service'
import type { Contact } from '~/types/contact'

definePageMeta({
  layout: 'dashboard'
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')
const { t } = useI18n()

const typeLabels: Record<string, string> = {
  customer: 'typeCustomer',
  vendor: 'typeVendor',
  supplier: 'typeSupplier',
  other: 'typeOther'
}

// State
const data = ref<Contact[]>([])
const isLoading = ref(false)
const selectedContact = ref<Contact | null>(null)

// Modal states
const showAddModal = ref(false)
const showUpdateModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Pagination meta
const meta = reactive({
  total: 0,
  from: 0,
  to: 0
})

// Fetch contacts from API
async function fetchContacts() {
  isLoading.value = true
  try {
    const response = await contactService.getAll(page.value, perPage.value, search.value, sortBy.value, order.value)
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

// Table columns
const columns: TableColumn<Contact>[] = [
  {
    accessorKey: 'id',
    header: () => t('pages.contact.columnId'),
    cell: ({ row }) => `#${row.getValue('id')}`
  },
  {
    accessorKey: 'name',
    header: sortHeader(() => t('pages.contact.columnName'), 'name')
  },
  {
    accessorKey: 'email',
    header: sortHeader(() => t('pages.contact.columnEmail'), 'email')
  },
  {
    accessorKey: 'phone',
    header: sortHeader(() => t('pages.contact.columnPhone'), 'phone')
  },
  {
    accessorKey: 'type',
    header: sortHeader(() => t('pages.contact.columnType'), 'type'),
    cell: ({ row }) => t(`pages.contact.${typeLabels[row.original.type]}`)
  },
  {
    accessorKey: 'isActive',
    header: sortHeader(() => t('pages.contact.columnStatus'), 'isActive'),
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return h(
        UBadge,
        {
          color: isActive ? 'primary' : 'error',
          variant: 'subtle'
        },
        () => (isActive ? t('pages.contact.active') : t('pages.contact.inactive'))
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: sortHeader(() => t('pages.contact.columnCreatedAt'), 'createdAt'),
    cell: ({ row }) => {
      const val = row.getValue('createdAt') as string
      if (!val) return '-'
      return new Date(val).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    id: 'actions',
    header: () => t('pages.contact.columnAction'),
    meta: {
      class: {
        td: 'text-right',
        th: 'text-right'
      }
    },
    cell: ({ row }) => {
      return h(
        UDropdownMenu,
        {
          content: {
            align: 'end'
          },
          items: getRowItems(row),
          'aria-label': t('pages.contact.actionsDropdown')
        },
        () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            'aria-label': t('pages.contact.actionsDropdown')
          })
      )
    }
  }
]

function getRowItems(row: Row<Contact>) {
  return [
    {
      label: t('pages.contact.editContact'),
      icon: 'i-lucide-edit',
      onSelect() {
        selectedContact.value = row.original
        showUpdateModal.value = true
      }
    },
    {
      label: t('pages.contact.deleteContact'),
      color: 'error',
      icon: 'i-lucide-trash',
      onSelect() {
        selectedContact.value = row.original
        showDeleteModal.value = true
      }
    }
  ]
}

// Handle delete
const toast = useToast()
const handleDelete = async () => {
  if (!selectedContact.value) return
  isDeleting.value = true
  try {
    const response = await contactService.delete(selectedContact.value.id)
    if (response.success) {
      toast.add({
        title: t('pages.contact.deletedSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    }
    showDeleteModal.value = false
    fetchContacts()
  } finally {
    isDeleting.value = false
  }
}

// Initial fetch
onMounted(() => {
  fetchContacts()
})
</script>
