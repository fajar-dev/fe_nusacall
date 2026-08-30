<template>
  <div class="space-y-6">
    <AppHeader
      :title="contact?.name || contact?.phoneNumber || '—'"
      :description="$t('pages.contactDetail.description')"
    >
      <template #actions>
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          :label="$t('pages.contactDetail.back')"
          @click="() => { navigateTo('/contact') }"
        />
      </template>
    </AppHeader>

    <UCard>
      <div
        v-if="loading"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-10"
        />
      </div>
      <dl
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <div
          v-for="field in fields"
          :key="field.label"
          class="flex flex-col gap-1 min-w-0"
        >
          <dt class="text-xs font-semibold text-muted uppercase tracking-wider">
            {{ field.label }}
          </dt>
          <dd class="text-sm text-highlighted truncate">
            {{ field.value }}
          </dd>
        </div>
      </dl>
    </UCard>

    <div class="space-y-5">
      <nav class="flex gap-6 border-b border-default">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="flex items-center gap-2 pb-2.5 -mb-px border-b-2 text-sm font-medium transition-colors"
          :class="isActive(tab.to)
            ? 'border-primary text-highlighted'
            : 'border-transparent text-muted hover:text-highlighted'"
        >
          <UIcon
            :name="tab.icon"
            class="size-4"
          />
          {{ tab.label }}
        </NuxtLink>
      </nav>

      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import { contactService } from '~/services/contact-service'
import type { Contact } from '~/types/contact'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()
const route = useRoute()

const contactId = Number(route.params.id)

const contact = ref<Contact | null>(null)
const loading = ref(true)

const tabs = computed(() => [
  { label: t('pages.contactDetail.tabs.calls'), to: `/contact/${contactId}/calls`, icon: 'i-lucide-phone' }
])

const isActive = (to: string) => route.path === to

const fields = computed(() => [
  { label: t('pages.contact.columnName'), value: contact.value?.name || '—' },
  { label: t('pages.contact.columnPhoneNumber'), value: contact.value?.phoneNumber || '—' },
  { label: t('pages.contact.columnTimeZone'), value: contact.value?.timeZone || '—' },
  { label: t('pages.contact.columnBranch'), value: contact.value?.branch?.name || '—' }
])

onMounted(async () => {
  try {
    const response = await contactService.getById(contactId)
    if (response.success) {
      contact.value = response.data
      return
    }
    showToast('error', t('pages.contactDetail.notFound'))
    navigateTo('/contact')
  } finally {
    loading.value = false
  }
})
</script>
