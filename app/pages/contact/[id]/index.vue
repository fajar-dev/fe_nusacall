<script setup lang="ts">
const route = useRoute()

definePageMeta({
  layout: 'dashboard'
})

await navigateTo(`/contact/${route.params.id}/calls`, { replace: true })
</script>

<template>
  <div />
</template>
