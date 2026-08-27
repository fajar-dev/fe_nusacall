<template>
  <div class="space-y-6">
    <Header
      :title="$t('pages.user.title')"
      :description="$t('pages.user.description')"
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
      :search-placeholder="$t('pages.user.searchPlaceholder')"
      table-class="min-w-[760px]"
    >
      <template #filters>
        <USelect
          v-model="organizationFilter"
          :items="organizationOptions"
          class="w-48"
        />
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { userService } from '~/services/user-service'
import { organizationService } from '~/services/organization-service'
import type { User } from '~/types/user'
import type { OrganizationListItem } from '~/types/organization'

definePageMeta({
  layout: 'dashboard'
})

const UAvatar = resolveComponent('UAvatar')
const { t } = useI18n()

const data = ref<User[]>([])
const isLoading = ref(false)
const organizations = ref<OrganizationListItem[]>([])
const organizationFilter = ref('all')

const meta = reactive({ total: 0, from: 0, to: 0 })

const organizationOptions = computed(() => [
  { label: t('pages.user.allOrganizations'), value: 'all' },
  ...organizations.value.map(org => ({ label: org.name, value: String(org.id) }))
])

async function fetchOrganizations() {
  const response = await organizationService.getList()
  if (response.success) organizations.value = response.data
}

async function fetchUsers() {
  isLoading.value = true
  try {
    const organizationId = organizationFilter.value === 'all' ? undefined : Number(organizationFilter.value)
    const response = await userService.getAll({
      page: page.value,
      limit: perPage.value,
      q: search.value,
      organizationId,
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

onMounted(fetchOrganizations)

const { search, perPage, page, sortBy, order, sortHeader } = useTableQuery(fetchUsers)

watch(organizationFilter, () => {
  page.value = 1
  fetchUsers()
})

/** Small colored-dot pill: filled circle + label, red when offline, green when online. */
function statusDot(active: boolean, label: string) {
  return h('span', { class: 'inline-flex items-center gap-1.5 text-highlighted w-fit' }, [
    h('span', { class: `size-3 rounded-full ${active ? 'bg-success' : 'bg-error'}` }),
    label
  ])
}

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'name',
    header: sortHeader(() => t('pages.user.columnUser'), 'name'),
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2.5' }, [
      h(UAvatar, { src: row.original.photo ?? undefined, alt: row.original.name }),
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-highlighted' }, row.original.name),
        h('span', { class: 'text-xs text-muted' }, row.original.email)
      ])
    ])
  },
  {
    accessorKey: 'role',
    header: sortHeader(() => t('pages.user.columnRole'), 'role')
  },
  {
    accessorKey: 'organization',
    header: sortHeader(() => t('pages.user.columnOrganization'), 'organization'),
    cell: ({ row }) => row.original.organization?.name || '—'
  },
  {
    accessorKey: 'branch',
    header: t('pages.user.columnBranch'),
    cell: ({ row }) => row.original.branch?.name || '—'
  },
  {
    accessorKey: 'availability',
    header: t('pages.user.columnStatus'),
    cell: ({ row }) => statusDot(row.original.availability === 'available', t(`pages.user.status.${row.original.availability}`))
  }
]
</script>
