<template>
  <div class="space-y-6">
    <AppHeader
      :title="$t('pages.account.title')"
      :description="$t('pages.account.description')"
    />

    <div
      v-if="isLoading"
      class="text-sm text-muted"
    >
      {{ $t('pages.account.loading') }}
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <div
        v-for="acc in accounts"
        :key="acc.id"
        class="space-y-5"
      >
        <div>
          <h2 class="font-semibold text-highlighted">
            {{ acc.label }}
          </h2>
          <p class="text-muted text-sm">
            {{ $t('pages.account.accountInfo', { id: acc.businessAccountId }) }}
          </p>
        </div>

        <div class="overflow-x-auto">
          <UTable
            :data="[acc]"
            :columns="columns"
            :ui="{
              th: 'bg-muted py-2.5',
              td: 'text-highlighted py-3'
            }"
            class="border border-default rounded-md"
          >
            <template #id-cell="{ row }">
              {{ row.original.phoneNumberId || row.original.id }}
            </template>

            <template #appId-cell="{ row }">
              {{ row.original.appId || '-' }}
            </template>

            <template #name-cell="{ row }">
              {{ row.original.label }}
            </template>

            <template #number-cell="{ row }">
              {{ formatPhoneNumber(row.original.displayPhoneNumber) }}
            </template>

            <template #color-cell="{ row }">
              <span
                class="size-5 rounded-full inline-block align-middle"
                :style="{ backgroundColor: row.original.color }"
              />
            </template>

            <template #status-cell="{ row }">
              {{ row.original.callingEnabled ? $t('pages.account.enabled') : '-' }}
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton
                  icon="i-lucide-pencil"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :title="$t('pages.account.edit')"
                  :aria-label="$t('pages.account.edit')"
                  @click="openEdit(row.original)"
                />
                <UButton
                  icon="i-lucide-refresh-cw"
                  size="sm"
                  color="neutral"
                  variant="outline"
                  :loading="syncingId === row.original.id"
                  :title="$t('pages.account.sync')"
                  :aria-label="$t('pages.account.sync')"
                  @click="doSync(row.original)"
                />
              </div>
            </template>
          </UTable>
        </div>
      </div>
    </div>

    <AccountUpdateModal
      v-model:open="editOpen"
      :account="selected"
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { accountService } from '~/services/account-service'
import { replaceById } from '~/utils/array'
import type { Account } from '~/types/account'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()
const toast = useToast()

const accounts = ref<Account[]>([])
const isLoading = ref(true)
const editOpen = ref(false)
const selected = ref<Account | null>(null)
const syncingId = ref<number | null>(null)

const columns = computed<TableColumn<Account>[]>(() => [
  {
    accessorKey: 'phoneNumberId',
    id: 'id',
    header: () => t('pages.account.columnId')
  },
  {
    accessorKey: 'label',
    id: 'name',
    header: () => t('pages.account.columnName')
  },
  {
    accessorKey: 'displayPhoneNumber',
    id: 'number',
    header: () => t('pages.account.columnNumber')
  },
  {
    accessorKey: 'color',
    id: 'color',
    header: () => t('pages.account.columnColor')
  },
  {
    accessorKey: 'callingEnabled',
    id: 'status',
    header: () => t('pages.account.columnStatus')
  },
  {
    id: 'actions',
    header: () => t('pages.account.columnActions')
  }
])

async function fetchAccounts() {
  isLoading.value = true
  try {
    const response = await accountService.getAll()
    if (response.success) accounts.value = response.data
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAccounts)

function openEdit(acc: Account) {
  selected.value = acc
  editOpen.value = true
}

function handleUpdated(updated: Account) {
  replaceById(accounts.value, updated)
}

async function doSync(acc: Account) {
  syncingId.value = acc.id
  try {
    const response = await accountService.sync(acc.id)
    if (response.success) {
      handleUpdated(response.data)
      toast.add({ title: t('pages.account.syncSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
    }
  } catch {
    return
  } finally {
    syncingId.value = null
  }
}
</script>
