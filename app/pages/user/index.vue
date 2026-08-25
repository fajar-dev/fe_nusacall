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
      table-class="min-w-[640px]"
    />
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { userService } from '~/services/user-service'
import type { User, UserAvailability } from '~/types/user'

definePageMeta({
  layout: 'dashboard'
})

const UBadge = resolveComponent('UBadge')
const { t } = useI18n()

const data = ref<User[]>([])
const isLoading = ref(false)

const meta = reactive({ total: 0, from: 0, to: 0 })

async function fetchUsers() {
  isLoading.value = true
  try {
    const response = await userService.getAll(page.value, perPage.value, search.value)
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

const { search, perPage, page } = useTableQuery(fetchUsers)

const statusColor: Record<UserAvailability, 'success' | 'neutral'> = {
  available: 'success',
  offline: 'neutral'
}

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'name',
    header: t('pages.user.columnUser'),
    cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
      h('span', { class: 'font-medium text-highlighted' }, row.original.name),
      h('span', { class: 'text-xs text-muted' }, row.original.email)
    ])
  },
  {
    accessorKey: 'role',
    header: t('pages.user.columnRole')
  },
  {
    accessorKey: 'availability',
    header: t('pages.user.columnStatus'),
    cell: ({ row }) => {
      const availability = row.original.availability
      return h(
        UBadge,
        { color: statusColor[availability], variant: 'subtle' },
        () => t(`pages.user.status.${availability}`)
      )
    }
  }
]
</script>
