import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  const { state } = useAuth()

  const publicPaths = ['/auth/sign-in']

  if (publicPaths.includes(to.path)) return

  if (!state.token) {
    return navigateTo('/auth/sign-in')
  }
})
