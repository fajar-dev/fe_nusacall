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
            {{ $t('pages.account.accountInfo', { id: acc.phoneNumberId || acc.id }) }}
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
              <div class="flex items-center justify-end gap-3">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="link"
                  @click="openEdit(row.original)"
                >
                  {{ $t('pages.account.edit') }}
                </UButton>
                <UButton
                  size="sm"
                  color="primary"
                  variant="link"
                  :loading="syncingId === row.original.id"
                  @click="doSync(row.original)"
                >
                  {{ $t('pages.account.sync') }}
                </UButton>
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
    accessorKey: 'appId',
    id: 'appId',
    header: () => t('pages.account.columnAppId')
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
    header: () => ''
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
