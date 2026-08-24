<template>
  <div class="w-full">
    <div class="w-full max-w-sm mx-auto">
      <div class="flex flex-col gap-5 mb-6">
        <BrandLogo />
        <div class="space-y-1">
          <h1 class="text-3xl font-bold text-highlighted">
            {{ $t('pages.auth.signIn.title') }}
          </h1>
          <p class="text-toned">
            {{ $t('pages.auth.signIn.description') }}
          </p>
        </div>
      </div>

      <UForm
        :state="state"
        :schema="loginSchema"
        class="space-y-4"
        @submit="handleLogin"
      >
        <UFormField
          :label="$t('pages.auth.signIn.emailLabel')"
          name="email"
          required
          class="w-full font-medium text-highlighted"
          :ui="{ label: 'text-sm font-medium text-highlighted' }"
        >
          <UInput
            id="email"
            v-model="state.email"
            type="email"
            :placeholder="$t('pages.auth.signIn.emailPlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('pages.auth.signIn.passwordLabel')"
          name="password"
          required
          class="w-full"
          :ui="{ label: 'text-sm font-medium text-highlighted' }"
        >
          <UInput
            id="password"
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="$t('pages.auth.signIn.passwordPlaceholder')"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="ghost"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="text-dimmed hover:text-toned p-1 hover:bg-transparent cursor-pointer"
                :aria-label="$t('pages.auth.signIn.togglePasswordVisibility')"
                @click="() => { showPassword = !showPassword }"
              />
            </template>
          </UInput>
        </UFormField>

        <div class="flex flex-col gap-3 pt-2">
          <UButton
            type="submit"
            block
            color="primary"
            :loading="loading"
          >
            {{ $t('pages.auth.signIn.login') }}
          </UButton>
        </div>
      </UForm>

      <USeparator
        :label="$t('pages.auth.signIn.or')"
        class="my-5"
        color="neutral"
      />

      <div v-if="googleClientId">
        <div
          ref="googleButtonEl"
          class="mt-4 flex justify-center w-full"
        />
      </div>
    </div>

    <p class="absolute bottom-6 left-0 right-0 text-center text-sm text-toned">
      2026 &copy; PT. Media Antar Nusa
    </p>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { authService } from '~/services/auth-service'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { t } = useI18n()

useHead({
  title: t('pages.auth.signIn.title')
})

const state = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const toast = useToast()

const showToast = (type: 'success' | 'error', title: string) => {
  toast.add({
    title,
    icon: type === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-x'
  })
}

const loginSchema = z.object({
  email: z.string().min(1, t('pages.auth.signIn.emailRequired')),
  password: z.string().min(1, t('pages.auth.signIn.passwordRequired'))
})

const handleLogin = async () => {
  loading.value = true
  try {
    await authService.login(state.email, state.password)
    showToast('success', t('pages.auth.signIn.loginSuccess'))
    navigateTo('/')
  } catch {
    // authService.login() already surfaced a toast via handleServiceError
    // before re-throwing (so callers CAN branch on failure); this catch
    // only exists to stop the rejection from propagating as an unhandled
    // promise rejection out of the form's submit handler.
  } finally {
    loading.value = false
  }
}

const { public: { googleClientId } } = useRuntimeConfig()
const googleButtonEl = ref<HTMLElement | null>(null)

async function handleGoogleCredential(response: { credential: string }) {
  loading.value = true
  try {
    await authService.loginWithGoogle(response.credential)
    showToast('success', t('pages.auth.signIn.loginSuccess'))
    navigateTo('/')
  } catch {
    // authService.loginWithGoogle() already surfaced a toast via handleServiceError
  } finally {
    loading.value = false
  }
}

function loadGoogleIdentityScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.getElementById('google-identity-script')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.id = 'google-identity-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity script'))
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (!googleClientId || !googleButtonEl.value) return
  try {
    await loadGoogleIdentityScript()
    window.google!.accounts.id.initialize({
      client_id: googleClientId as string,
      hd: 'nusa.id',
      callback: handleGoogleCredential
    })
    const width = googleButtonEl.value.clientWidth || 384
    window.google!.accounts.id.renderButton(googleButtonEl.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: Math.min(width, 400)
    })
  } catch (err) {
    console.error('Failed to initialize Google sign-in', err)
  }
})
</script>
