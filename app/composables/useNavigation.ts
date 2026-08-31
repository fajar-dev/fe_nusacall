import { useRoute } from 'vue-router'
import { toggleValue } from '~/utils/array'

export interface NavItem {
  id: string
  label: string
  to: string
  icon?: string
  children?: NavItem[]
}

export interface NavGroup {
  id?: string
  title?: string
  items: NavItem[]
}

export const useNavigation = () => {
  const route = useRoute()
  const { t } = useI18n()
  const isCollapsed = useState('sidebar-collapsed', () => false)
  const expandedItems = useState<string[]>('sidebar-expanded', () => ['group:main'])

  const navGroups = computed<NavGroup[]>(() => [
    {
      items: [
        {
          id: 'dashboard',
          label: t('components.sidebar.nav.dashboard'),
          to: '/',
          icon: 'i-lucide-layout-dashboard'
        }
      ]
    },
    {
      id: 'main',
      title: t('components.sidebar.nav.main'),
      items: [
        {
          id: 'contact',
          label: t('components.sidebar.nav.contact'),
          to: '/contact',
          icon: 'i-lucide-notebook-text'
        },
        {
          id: 'user',
          label: t('components.sidebar.nav.user'),
          to: '/user',
          icon: 'i-lucide-users'
        },
        {
          id: 'report',
          label: t('components.sidebar.nav.report'),
          to: '#',
          icon: 'i-lucide-clipboard-list'
        }
      ]
    }
  ])

  const bottomNavItems = computed<NavItem[]>(() => [
    {
      id: 'feedback',
      label: t('components.sidebar.nav.feedback'),
      to: '/feedback',
      icon: 'i-lucide-message-square-warning'
    },
    {
      id: 'whatsapp',
      label: t('components.sidebar.nav.whatsapp'),
      to: '/account',
      icon: 'i-lucide-phone'
    }
  ])

  const isItemActive = (item: NavItem) => {
    if (!item.to || item.to === '#') return false
    if (item.to === '/') {
      return route.path === '/'
    }
    return route.path.startsWith(item.to)
  }

  const isParentActive = (item: NavItem) => {
    if (!item.children) return false
    return item.children.some(child => isItemActive(child))
  }

  const toggleExpanded = (id: string) => {
    toggleValue(expandedItems.value, id)
  }

  const isExpanded = (id: string) => {
    return expandedItems.value.includes(id)
  }

  return {
    isCollapsed,
    navGroups,
    bottomNavItems,
    isItemActive,
    isParentActive,
    toggleExpanded,
    isExpanded
  }
}
