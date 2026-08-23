import axios from 'axios'
import type { AxiosInstance } from 'axios'

export class ApiService {
    private refreshHandler: (() => Promise<string | null>) | null = null

    public setRefreshHandler(handler: () => Promise<string | null>) {
        this.refreshHandler = handler
    }

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
            'Accept-Language': locale.value,
        }
        })

        instance.interceptors.response.use(
        (response) => {
            return response
        },
        async (error) => {
            const originalRequest = error.config

            if (error.response?.status === 403) {
                if (typeof window !== 'undefined') {
                    navigateTo('/')
                }
            }

            if (error.response?.status === 401 && !originalRequest._retry) {
                if (typeof window !== 'undefined' && window.location.pathname === '/sign-in') {
                    return Promise.reject(error)
                }

                originalRequest._retry = true

            if (this.refreshHandler) {
                try {
                const newToken = await this.refreshHandler()
                if (newToken) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    return instance(originalRequest)
                }
                } catch (refreshError) {
                // Refresh failed, proceed to logout
                }
            }

            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
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