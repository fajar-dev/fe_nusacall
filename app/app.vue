<template>
  <UApp :toaster="{ position: 'top-right', progress: false }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const siteUrl = (config.public.siteUrl as string) || 'https://call.nusacontact.com'
const title = 'NusaCall by NusaContact'
const description = 'Manage all your WhatsApp Calling efficiently with our platform'
const ogImage = `${siteUrl}/og-image.png`

useHead({
  htmlAttrs: {
    lang: 'id'
  },
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ]
})

useSeoMeta({
  title,
  description,
  ogSiteName: 'NusaCall',
  ogType: 'website',
  ogUrl: siteUrl,
  ogTitle: title,
  ogDescription: description,
  ogImage,
  ogImageSecureUrl: ogImage,
  ogImageType: 'image/jpeg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: title,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: ogImage
})
</script>
