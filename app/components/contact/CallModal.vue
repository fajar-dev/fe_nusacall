<template>
  <UModal
    v-model:open="open"
    :title="$t('components.contactCall.title')"
    :description="contact?.name || contact?.phoneNumber || ''"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('components.contactCall.account')">
          <USelectMenu
            v-model="selectedPhoneNumberId"
            :items="accountOptions"
            value-key="value"
            :loading="loadingAccounts"
            :placeholder="$t('components.contactCall.accountPlaceholder')"
            class="w-full"
          />
        </UFormField>

        <div
          v-if="selectedPhoneNumberId"
          class="flex items-center justify-between gap-3 p-3 rounded-lg border border-default bg-elevated"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon
              name="i-lucide-shield-check"
              class="size-4 text-muted shrink-0"
            />
            <USkeleton
              v-if="loadingPermission"
              class="h-4 w-32"
            />
            <span
              v-else-if="hasPermission"
              class="text-xs text-toned truncate"
            >
              {{ quotaText || $t('components.contactCall.allowed') }}
            </span>
            <UBadge
              v-else
              color="neutral"
              variant="subtle"
              size="xs"
            >
              {{ $t('components.callOutbound.noPermission') }}
            </UBadge>
          </div>

          <UButton
            v-if="hasPermission"
            icon="i-lucide-phone-outgoing"
            size="xs"
            color="primary"
            :loading="calling"
            :disabled="softphoneState !== 'idle'"
            @click="startCall"
          >
            {{ $t('components.callOutbound.call') }}
          </UButton>
          <UButton
            v-else-if="!loadingPermission"
            icon="i-lucide-send"
            size="xs"
            variant="subtle"
            :loading="requesting"
            :disabled="justRequested"
            @click="requestPermission"
          >
            {{ justRequested ? $t('components.callOutbound.requested') : $t('components.callOutbound.requestPermission') }}
          </UButton>
        </div>

        <p
          v-if="!loadingAccounts && !accountOptions.length"
          class="text-sm text-muted"
        >
          {{ $t('components.contactCall.noAccount') }}
        </p>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { accountService } from '~/services/account-service'
import { permissionService } from '~/services/permission-service'
import type { Account } from '~/types/account'
import type { Contact } from '~/types/contact'
import type { PermissionCheckResult } from '~/types/permission'

const props = defineProps<{ contact: Contact | null }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { state: softphoneState, callOutbound } = useSoftphone()

const accounts = ref<Account[]>([])
const loadingAccounts = ref(false)
const selectedPhoneNumberId = ref<string | undefined>(undefined)

const permission = ref<PermissionCheckResult | null>(null)
const loadingPermission = ref(false)
const calling = ref(false)
const requesting = ref(false)
const justRequested = ref(false)

const accountOptions = computed(() =>
  accounts.value
    .filter(account => account.callingEnabled)
    .map(account => ({ label: `${account.label} · ${account.displayPhoneNumber}`, value: account.phoneNumberId }))
)

const hasPermission = computed(() => {
  if (!permission.value) return false
  if (permission.value.status === 'permanent') return true
  if (permission.value.status === 'temporary') {
    return !permission.value.expiresAt || new Date(permission.value.expiresAt) > new Date()
  }
  return false
})

const quotaText = computed(() => {
  const action = permission.value?.quota?.find(a => a.action_name === 'start_call')
  const limit = action?.limits?.[0]
  if (!limit) return null
  return t('components.callOutbound.quota', { used: limit.current_usage, max: limit.max_allowed })
})

async function fetchAccounts() {
  loadingAccounts.value = true
  try {
    const response = await accountService.getAll()
    if (response.success) {
      accounts.value = response.data
      if (accountOptions.value.length === 1) {
        selectedPhoneNumberId.value = accountOptions.value[0]!.value
      }
    }
  } finally {
    loadingAccounts.value = false
  }
}

async function loadPermission() {
  if (!selectedPhoneNumberId.value || !props.contact) return
  loadingPermission.value = true
  justRequested.value = false
  try {
    const response = await permissionService.check(selectedPhoneNumberId.value, props.contact.id)
    permission.value = response.success ? response.data : null
  } catch {
    permission.value = null
  } finally {
    loadingPermission.value = false
  }
}

async function requestPermission() {
  if (!selectedPhoneNumberId.value || !props.contact) return
  requesting.value = true
  try {
    await permissionService.request(selectedPhoneNumberId.value, props.contact.id)
    showToast('success', t('components.callOutbound.requestSentTitle'))
    justRequested.value = true
  } finally {
    requesting.value = false
  }
}

async function startCall() {
  if (!selectedPhoneNumberId.value || !props.contact) return
  calling.value = true
  try {
    await callOutbound(selectedPhoneNumberId.value, props.contact.id)
    open.value = false
  } finally {
    calling.value = false
  }
}

watch(selectedPhoneNumberId, () => {
  permission.value = null
  loadPermission()
})

watch(open, (isOpen) => {
  if (!isOpen) return
  permission.value = null
  justRequested.value = false
  selectedPhoneNumberId.value = undefined
  fetchAccounts()
})
</script>
