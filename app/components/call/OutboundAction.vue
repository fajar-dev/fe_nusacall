<template>
  <div class="flex items-center gap-2 flex-wrap">
    <p
      v-if="loading"
      class="text-xs text-dimmed"
    >
      {{ $t('components.callOutbound.checking') }}
    </p>

    <template v-else-if="hasPermission">
      <UButton
        icon="i-lucide-phone-outgoing"
        size="sm"
        color="primary"
        :loading="calling"
        :disabled="softphoneState !== 'idle'"
        @click="call"
      >
        {{ $t('components.callOutbound.call') }}
      </UButton>
      <span
        v-if="quotaText"
        class="text-xs text-dimmed"
      >{{ quotaText }}</span>
    </template>

    <template v-else>
      <UBadge
        color="neutral"
        variant="subtle"
      >
        {{ $t('components.callOutbound.noPermission') }}
      </UBadge>
      <UButton
        icon="i-lucide-send"
        size="sm"
        variant="subtle"
        :loading="requesting"
        :disabled="justRequested"
        @click="requestPermission"
      >
        {{ justRequested ? $t('components.callOutbound.requested') : $t('components.callOutbound.requestPermission') }}
      </UButton>
    </template>
  </div>
</template>

<script setup lang="ts">
import { permissionService } from '~/services/permission-service'
import type { PermissionCheckResult } from '~/types/permission'

const props = defineProps<{ phoneNumberId: string, waId: string }>()

const { t } = useI18n()
const toast = useToast()
const { state: softphoneState, callOutbound } = useSoftphone()

const loading = ref(true)
const calling = ref(false)
const requesting = ref(false)
const justRequested = ref(false)
const permission = ref<PermissionCheckResult | null>(null)

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

async function loadPermission() {
  loading.value = true
  try {
    const response = await permissionService.check(props.phoneNumberId, props.waId)
    permission.value = response.data
  } catch {
    // handleServiceError already toasted — leave permission null (renders as "no permission")
  } finally {
    loading.value = false
  }
}

async function requestPermission() {
  requesting.value = true
  try {
    await permissionService.request(props.phoneNumberId, props.waId)
    toast.add({
      title: t('components.callOutbound.requestSentTitle'),
      description: t('components.callOutbound.requestSentDescription'),
      icon: 'i-lucide-send',
      color: 'success'
    })
    justRequested.value = true
  } catch {
    // handleServiceError already toasted (e.g. template not configured, rate limited)
  } finally {
    requesting.value = false
  }
}

async function call() {
  calling.value = true
  try {
    await callOutbound(props.phoneNumberId, props.waId)
  } finally {
    calling.value = false
  }
}

onMounted(loadPermission)
</script>
