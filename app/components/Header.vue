<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-4 shrink-0 select-none">
    <header class="flex items-center justify-between px-2 py-2 lg:hidden bg-default border-b border-default shrink-0 -mx-4 -mt-4 mb-4">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          :aria-label="$t('components.header.openMenu')"
          @click="() => { isMobileMenuOpen = true }"
        />
        <BrandLogo size="sm" />
      </div>

      <div class="flex items-center gap-3">
        <NuxtLink to="/feedback">
          <UButton
            icon="i-lucide-message-square-warning"
            color="neutral"
            variant="ghost"
            :aria-label="$t('components.sidebar.nav.feedback')"
          />
        </NuxtLink>
        <UserPopover />
      </div>
    </header>

    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h2 class="text-xl md:text-2xl font-bold text-highlighted tracking-tight">
          {{ title }}
        </h2>
        <p
          v-if="description"
          class="text-sm md:text-sm text-muted"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div
      v-if="$slots.tabs"
      class="border-b border-default mt-7"
    >
      <nav class="flex gap-6 -mb-px">
        <slot name="tabs" />
      </nav>
    </div>

    <div
      v-if="$slots.actions"
      class="flex justify-end items-center gap-3 pt-1"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()

// Share mobile sidebar menu open state globally across layout and headers
const isMobileMenuOpen = useState('isMobileMenuOpen', () => false)
</script>
