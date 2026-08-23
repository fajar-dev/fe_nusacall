import { useRoute } from 'vue-router'

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
          id: 'menu',
          label: t('components.sidebar.nav.menu'),
          to: '#',
          icon: 'i-lucide-list',
          children: [
            { id: 'sub menu 1', label: t('components.sidebar.nav.subMenu1'), to: '#' },
            { id: 'sub Menu 2', label: t('components.sidebar.nav.subMenu2'), to: '#' }
          ]
        },
        {
          id: 'contact',
          label: t('components.sidebar.nav.contact'),
          to: '/contact',
          icon: 'i-lucide-notebook-text'
        },
        {
          id: 'users',
          label: t('components.sidebar.nav.users'),
          to: '/user',
          icon: 'i-lucide-user'
        },
      ]
    }
  ])

  const bottomNavItems = computed<NavItem[]>(() => [
    {
      id: 'feedback',
      label: t('components.sidebar.nav.feedback'),
      to: '/feedback',
      icon: 'i-lucide-message-square-warning'
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
    const index = expandedItems.value.indexOf(id)
    if (index === -1) {
      expandedItems.value.push(id)
    } else {
      expandedItems.value.splice(index, 1)
    }
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
