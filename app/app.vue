<template>
  <UApp :toaster="{ position: 'top-right', progress: false }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'id'
  }
})

const title = 'NusaCall by NusaContact'
const description = 'Manage all your WhatsApp Calling efficiently with our platform'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>
