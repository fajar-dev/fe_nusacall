<template>
  <UModal
    v-model:open="open"
    :title="$t('components.user.updateModal.title')"
    :description="$t('components.user.updateModal.description')"
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
            {{ $t('components.user.updateModal.choosePhoto') }}
          </UButton>
          <UButton
            v-if="previewUrl || form.photo"
            size="xs"
            color="error"
            variant="outline"
            icon="i-lucide-trash"
            @click="removePhoto"
          >
            {{ $t('components.user.updateModal.remove') }}
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
        id="update-user-form"
        :schema="schema"
        :state="form"
        class="space-y-3"
        @submit="handleSubmit"
      >
        <UFormField
          :label="$t('components.user.updateModal.nameLabel')"
          name="name"
          required
        >
          <UInput
            v-model="form.name"
            :placeholder="$t('components.user.updateModal.namePlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.user.updateModal.emailLabel')"
          name="email"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            :placeholder="$t('components.user.updateModal.emailPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.user.updateModal.passwordLabel')"
          name="password"
        >
          <UInput
            v-model="form.password"
            type="password"
            :placeholder="$t('components.user.updateModal.passwordPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.user.updateModal.statusLabel')"
          name="isActive"
        >
          <div class="flex items-center gap-2">
            <USwitch v-model="form.isActive" />
            <span class="text-sm text-toned">{{ form.isActive ? $t('components.user.updateModal.active') : $t('components.user.updateModal.inactive') }}</span>
          </div>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton
          :label="$t('components.user.updateModal.cancel')"
          color="neutral"
          variant="soft"
          @click="() => { open = false }"
        />
        <UButton
          type="submit"
          form="update-user-form"
          color="primary"
          :loading="isSubmitting"
          :disabled="isUploading"
        >
          {{ $t('components.user.updateModal.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { userService } from '~/services/user-service'
import type { User, UserPayload } from '~/types/user'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()
const isSubmitting = ref(false)
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)

const { t } = useI18n()

// Schema for updating (password is optional, min 6 if filled)
const schema = z.object({
  name: z.string().min(1, t('components.user.updateModal.nameRequired')),
  email: z.string().min(1, t('components.user.updateModal.emailRequired')).email(t('components.user.updateModal.emailInvalid')),
  password: z.string().min(6, t('components.user.updateModal.passwordMin')).optional().or(z.literal('')),
  isActive: z.boolean()
})

const form = reactive<UserPayload>({
  name: '',
  email: '',
  password: '',
  photo: null,
  isActive: true
})

const populateForm = () => {
  if (props.user) {
    form.name = props.user.name
    form.email = props.user.email
    form.password = ''
    form.photo = props.user.photo // will contain the MinIO presigned URL (or path)
    form.isActive = props.user.isActive
    previewUrl.value = props.user.photo // display existing photo
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
        title: t('components.user.updateModal.photoUploadSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
    } else {
      toast.add({
        title: t('components.user.updateModal.photoUploadFailed'),
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    }
  } catch {
    toast.add({
      title: t('components.user.updateModal.photoUploadFailed'),
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
  if (!props.user) return
  isSubmitting.value = true

  // Build payload
  const payload: UserPayload = {
    name: form.name,
    email: form.email,
    photo: form.photo,
    isActive: form.isActive
  }

  // Only send password if user filled it
  if (form.password && form.password.trim() !== '') {
    payload.password = form.password
  }

  try {
    const response = await userService.update(props.user.id, payload)
    if (response.success) {
      toast.add({
        title: t('components.user.updateModal.updatedSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('updated')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (val) {
    populateForm()
  } else {
    previewUrl.value = null
  }
})
</script>
