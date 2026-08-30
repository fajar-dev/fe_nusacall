<template>
  <div class="flex h-screen w-full font-sans text-highlighted overflow-hidden">
    <div class="hidden lg:block h-full">
      <AppSidebar />
    </div>

    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 lg:hidden"
    >
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        appear
      >
        <div
          class="fixed inset-0 backdrop-blur-xs bg-white/10 dark:bg-black/40"
          @click="() => { isMobileMenuOpen = false }"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
        appear
      >
        <div class="fixed inset-y-0 left-0 w-64 z-50 bg-default h-full shadow-2xl">
          <AppSidebar class="h-full" />
        </div>
      </Transition>
    </div>

    <CallBoardPanel />

    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <main class="flex-1 overflow-y-auto p-4 lg:px-6">
        <slot />
      </main>
    </div>

    <SoftphoneCallWidget />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const isMobileMenuOpen = useState('isMobileMenuOpen', () => false)

watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})
</script>
