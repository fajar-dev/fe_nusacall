<template>
  <div class="flex min-h-screen w-full select-none">
    <!-- Left Panel -->
    <div class="hidden lg:flex lg:w-3/5 relative overflow-hidden">
      <!-- Hero image -->
      <div class="absolute inset-0 z-0 bg-[url('/hero.webp')] bg-cover bg-center pointer-events-none" />

      <!-- Grid overlay -->
      <div class="absolute inset-0 z-[1] bg-[url('/grid.svg')] bg-cover bg-center opacity-[0.30] pointer-events-none" />

      <!-- Dark gradient overlay (bottom-heavy, keeps top clean) -->
      <div class="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none" />

      <!-- Subtle vignette -->
      <div class="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_100px_10px_rgba(0,0,0,0.2)]" />

      <!-- Bottom Content -->
      <div class="relative z-30 flex w-full flex-col justify-end p-14 text-white">
        <slot name="hero">
          <h1 class="text-5xl font-semibold leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            NusaCall
          </h1>
          <p class="text-xl text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
            Manage all your WhatsApp calling efficiently with our platform.
          </p>
        </slot>
      </div>
    </div>

    <!-- Right Panel -->
    <div class="relative z-50 flex flex-1 lg:w-2/5 lg:flex-none items-center justify-center bg-default px-6 py-12 lg:shadow-[-12px_0_40px_-16px_rgba(0,0,0,0.18)]">
      <!-- Dark Mode Toggle + Language Switcher (top-right) -->
      <div class="absolute top-6 right-6 z-30 flex items-center gap-2">
        <UColorModeButton
          color="neutral"
          variant="ghost"
        />
        <LanguageSwitcher variant="ghost" />
      </div>

      <slot />
    </div>
  </div>
</template>
