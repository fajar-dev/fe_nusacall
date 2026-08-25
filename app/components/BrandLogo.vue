<template>
  <div class="flex items-center gap-3">
    <NuxtLink
      to="/"
      class="flex items-center gap-2.5"
    >
      <img
        src="/logo.png"
        alt="logo"
        :class="logoClass"
      >
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isCollapsed?: boolean
  size?: 'sm' | 'md' | 'lg'
  imageClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const logoClass = computed(() => {
  if (props.imageClass) return props.imageClass
  if (props.size === 'sm') return 'h-9 w-auto'
  if (props.size === 'lg') return 'h-11.5 w-auto'
  return 'h-10 w-auto'
})
</script>
