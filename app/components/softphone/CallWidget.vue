<template>
  <div>
    <SoftphoneIncomingCallModal />

    <div
      v-if="state === 'active' || state === 'connecting'"
      class="fixed bottom-4 right-4 z-30 w-72"
    >
      <SoftphoneActiveCallPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
const { state, init } = useSoftphone()

onMounted(() => {
  init()
})
</script>
