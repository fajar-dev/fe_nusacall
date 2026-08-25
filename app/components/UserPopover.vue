<template>
  <UPopover v-bind="popoverProps">
    <slot>
      <UAvatar
        :alt="authState.user?.name || authState.user?.email"
        size="lg"
        class="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
      />
    </slot>

    <template #content>
      <div class="p-2 w-56 space-y-1.5 select-none">
        <div class="flex items-center gap-3 p-1.5">
          <UAvatar
            :alt="authState.user?.name || authState.user?.email"
            size="lg"
          />
          <div class="min-w-0 flex-1">
            <h2 class="text-sm font-semibold truncate text-highlighted">
              {{ authState.user?.name || authState.user?.email }}
            </h2>
            <p class="text-xs text-muted truncate">
              {{ authState.user?.email }}
            </p>
          </div>
        </div>

        <USeparator />

        <div class="space-y-0.5">
          <UDropdownMenu
            :items="themeMenuItems"
            :content="{ side: 'right', sideOffset: 15 }"
            mode="hover"
          >
            <UButton
              color="neutral"
              variant="ghost"
              :icon="currentThemeIcon"
              class="w-full justify-start cursor-pointer"
            >
              {{ $t('components.userPopover.theme') }}
            </UButton>

            <template #item-trailing="{ item }">
              <UIcon
                v-if="item.active"
                name="i-lucide-check"
                class="size-4 text-primary shrink-0"
              />
            </template>
          </UDropdownMenu>

          <UDropdownMenu
            :items="langMenuItems"
            :content="{ side: 'right', sideOffset: 15 }"
            mode="hover"
          >
            <UButton
              color="neutral"
              variant="ghost"
              :icon="currentLocaleFlag"
              class="w-full justify-start cursor-pointer"
            >
              {{ $t('components.userPopover.language') }}
            </UButton>

            <template #item-trailing="{ item }">
              <UIcon
                v-if="item.active"
                name="i-lucide-check"
                class="size-4 text-primary shrink-0"
              />
            </template>
          </UDropdownMenu>
        </div>

        <USeparator />

        <div>
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-log-out"
            class="w-full justify-start cursor-pointer"
            @click="handleLogout"
          >
            {{ $t('components.userPopover.logout') }}
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const { state: authState, service: authService } = useAuth()
const toast = useToast()
const colorMode = useColorMode()
const { locale, setLocale, t } = useI18n()

interface Props {
  popoverProps?: Record<string, unknown>
}

withDefaults(defineProps<Props>(), {
  popoverProps: () => ({})
})

const themeOptions = [
  { label: 'Light', value: 'light', icon: 'i-lucide-sun' },
  { label: 'Dark', value: 'dark', icon: 'i-lucide-moon' },
  { label: 'System', value: 'system', icon: 'i-lucide-laptop' }
]

const currentThemeIcon = computed(() => {
  if (colorMode.value === 'dark') return 'i-lucide-moon'
  return 'i-lucide-sun'
})

const themeMenuItems = computed(() =>
  themeOptions.map(opt => ({
    label: opt.label,
    icon: opt.icon,
    active: colorMode.preference === opt.value,
    onSelect: () => {
      colorMode.preference = opt.value
    }
  }))
)

const localeOptions: { label: string, value: 'en' | 'id', flag: string }[] = [
  { label: 'English', value: 'en', flag: 'circle-flags:us' },
  { label: 'Bahasa Indonesia', value: 'id', flag: 'circle-flags:id' }
]

const currentLocaleFlag = computed(() =>
  localeOptions.find(o => o.value === locale.value)?.flag ?? 'circle-flags:us'
)

const langMenuItems = computed(() =>
  localeOptions.map(opt => ({
    label: opt.label,
    icon: opt.flag,
    active: locale.value === opt.value,
    onSelect: () => {
      setLocale(opt.value)
    }
  }))
)

const handleLogout = async () => {
  await authService.logout()
  toast.add({
    title: t('components.userPopover.logoutSuccess'),
    icon: 'i-lucide-circle-check'
  })
}
</script>
