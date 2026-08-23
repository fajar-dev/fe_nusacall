<template>
  <UModal
    v-model:open="open"
    :title="$t('components.user.addModal.title')"
    :description="$t('components.user.addModal.description')"
color="neutral"
          variant="soft"
          @click="() => { open = false }"
  >
    <template #body>
      <!-- Avatar Upload Section -->
      <div class="flex flex-col items-center justify-center pb-4 space-y-2">
        <div
          class="relative group cursor-pointer"
          @click="triggerFileInput"
        >
          <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-default hover:border-primary/50 transition-colors duration-200 flex items-center justify-center bg-muted relative">
            <img
              v-if="previewUrl"
              :src="previewUrl"
              class="w-full h-full object-cover"
            >
            <UIcon
              v-else
              name="i-lucide-user"
              class="w-12 h-12 text-dimmed"
            />

            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <UIcon
                name="i-lucide-camera"
                class="w-6 h-6 text-white"
              />
            </div>

            <div
              v-if="isUploading"
              class="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-loader-2"
                class="w-6 h-6 text-white animate-spin"
              />
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            icon="i-lucide-upload"
            @click="triggerFileInput"
          >
            {{ $t('components.user.addModal.choosePhoto') }}
          </UButton>
          <UButton
            v-if="previewUrl || form.photo"
            size="xs"
            color="error"
            variant="outline"
            icon="i-lucide-trash"
            @click="removePhoto"
          >
            {{ $t('components.user.addModal.remove') }}
          </UButton>
        </div>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept="image/*"
          @change="onFileChange"
        >
      </div>

      <UForm
        id="add-user-form"
        :schema="schema"
        :state="form"
        class="space-y-3"
        @submit="handleSubmit"
      >
        <UFormField
          :label="$t('components.user.addModal.nameLabel')"
          name="name"
          required
        >
          <UInput
            v-model="form.name"
            :placeholder="$t('components.user.addModal.namePlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.user.addModal.emailLabel')"
          name="email"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            :placeholder="$t('components.user.addModal.emailPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.user.addModal.passwordLabel')"
          name="password"
          required
        >
          <UInput
            v-model="form.password"
            type="password"
            :placeholder="$t('components.user.addModal.passwordPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.user.addModal.statusLabel')"
          name="isActive"
        >
          <div class="flex items-center gap-2">
            <USwitch v-model="form.isActive" />
            <span class="text-sm text-toned">{{ form.isActive ? $t('components.user.addModal.active') : $t('components.user.addModal.inactive') }}</span>
          </div>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton
          :label="$t('components.user.addModal.cancel')"
          color="neutral"
          variant="soft"
          @click="() => { open = false }"
        />
        <UButton
          type="submit"
          form="add-user-form"
          color="primary"
          :loading="isSubmitting"
          :disabled="isUploading"
        >
          {{ $t('components.user.addModal.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { userService } from '~/services/user-service'
import type { UserPayload } from '~/types/user'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)

const { t } = useI18n()

const schema = z.object({
  name: z.string().min(1, t('components.user.addModal.nameRequired')),
  email: z.string().min(1, t('components.user.addModal.emailRequired')).email(t('components.user.addModal.emailInvalid')),
  password: z.string().min(6, t('components.user.addModal.passwordMin')),
  isActive: z.boolean()
})

const form = reactive<UserPayload>({
  name: '',
  email: '',
  password: '',
  photo: null,
  isActive: true
})

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.password = ''
  form.photo = null
  form.isActive = true
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Show local preview immediately
  previewUrl.value = URL.createObjectURL(file)

  // Upload to MinIO immediately
  isUploading.value = true
  try {
    const response = await userService.uploadPhoto(file)
    if (response.success && response.data?.path) {
      form.photo = response.data.path
      toast.add({
        title: t('components.user.addModal.photoUploadSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    } else {
      toast.add({
        title: t('components.user.addModal.photoUploadFailed'),
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    }
  } catch {
    toast.add({
      title: t('components.user.addModal.photoUploadFailed'),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isUploading.value = false
  }
}

const removePhoto = () => {
  form.photo = null
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await userService.create(form)
    if (response.success) {
      toast.add({
        title: t('components.user.addModal.createdSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('created')
      open.value = false
      resetForm()
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (!val) resetForm()
})
</script>
