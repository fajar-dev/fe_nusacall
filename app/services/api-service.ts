import axios from 'axios'
import type { AxiosInstance } from 'axios'

/** No refresh-token flow (8h JWT, tied to a nusawa session) — 401 means log out and re-login. */
export class ApiService {
  public get client(): AxiosInstance {
    const config = useRuntimeConfig()
    // useI18n() requires an active component setup context; this getter is often called
    // outside of it (services, middleware). useNuxtApp().$i18n exposes the same composer
    // without that restriction.
    const locale = useNuxtApp().$i18n.locale

    const instance = axios.create({
      baseURL: config.public.apiUrl as string,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': locale.value
      }
    })

    instance.interceptors.response.use(
      response => response,
      async (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined' && window.location.pathname !== '/auth/sign-in') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
            navigateTo('/auth/sign-in')
          }
        }
        return Promise.reject(error)
      }
    )

    return instance
  }
}

export const apiService = new ApiService()
