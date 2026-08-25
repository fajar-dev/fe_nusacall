<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="relative h-full shrink-0 select-none">
    <aside class="flex flex-col h-full bg-default border-r border-default shrink-0 justify-between w-full lg:w-24 p-2 lg:px-1 lg:py-3">
      <!-- Mobile Header (Logo + Close Button) -->
      <div class="flex items-center justify-between px-2 py-1 pb-2 shrink-0 lg:hidden border-b border-default mb-2">
        <BrandLogo />
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          class="text-toned hover:text-highlighted"
          :aria-label="$t('components.dashboardLayout.closeSidebar')"
          @click="closeMobileMenu"
        />
      </div>

      <!-- Desktop Header (Logo) -->
      <div class="hidden lg:flex flex-col items-center pb-4 pt-1 shrink-0">
        <BrandLogo size="lg" />
      </div>

      <USeparator
        class="hidden lg:block px-4 my-3"
        size="sm"
      />

      <!-- Navigation Content -->
      <nav class="flex-1 overflow-y-auto min-h-0 py-3 space-y-1 lg:space-y-1 scrollbar-thin">
        <template
          v-for="group in navGroups"
          :key="group.id || group.title"
        >
          <!-- Mobile Group Header -->
          <div
            v-if="group.title"
            class="px-3 pt-2 pb-1 text-xs font-medium text-muted uppercase tracking-wider lg:hidden"
          >
            {{ group.title }}
          </div>

          <template
            v-for="item in group.items"
            :key="item.id"
          >
            <!-- 1. ITEM WITH CHILDREN -->
            <template v-if="item.children && item.children.length">
              <!-- Mobile Submenu (Accordion) -->
              <div class="lg:hidden">
                <button
                  class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer group"
                  :class="[isParentActive(item) ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-muted/50 hover:text-highlighted']"
                  @click="toggleExpanded(item.id)"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <UIcon
                      v-if="item.icon"
                      :name="item.icon"
                      class="size-4 shrink-0"
                      :class="[isParentActive(item) ? 'text-primary' : 'text-muted']"
                    />
                    <span
                      class="text-sm truncate"
                      :class="[isParentActive(item) ? 'font-medium text-primary' : 'font-normal text-muted']"
                    >
                      {{ item.label }}
                    </span>
                  </div>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="size-4 shrink-0 transition-transform duration-200 text-muted"
                    :class="{ 'rotate-180': isExpanded(item.id) }"
                  />
                </button>

                <div
                  v-if="isExpanded(item.id)"
                  class="pl-7 pr-1 py-1 space-y-0.5"
                >
                  <NuxtLink
                    v-for="child in item.children"
                    :key="child.id"
                    :to="child.to"
                    class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
                    :class="[isItemActive(child) ? 'bg-primary/10 text-primary font-medium' : 'text-muted font-normal hover:bg-muted/40 hover:text-highlighted']"
                    @click="closeMobileMenu"
                  >
                    <UIcon
                      v-if="child.icon"
                      :name="child.icon"
                      class="size-3.5 shrink-0"
                      :class="[isItemActive(child) ? 'text-primary' : 'text-muted']"
                    />
                    <span class="truncate">{{ child.label }}</span>
                  </NuxtLink>
                </div>
              </div>

              <!-- Desktop Submenu (Hover Popover) -->
              <UPopover
                class="hidden lg:block"
                :content="{ side: 'right', sideOffset: 12, align: 'start' }"
                :ui="{ content: 'p-1' }"
                mode="hover"
              >
                <button
                  class="flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group"
                  :class="[isParentActive(item) ? 'text-primary' : 'text-muted hover:text-highlighted']"
                >
                  <div
                    class="w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                    :class="[
                      isParentActive(item)
                        ? 'bg-primary/10 text-primary shadow-xs'
                        : 'text-muted group-hover:bg-muted/60 group-hover:text-highlighted'
                    ]"
                  >
                    <UIcon
                      v-if="item.icon"
                      :name="item.icon"
                      class="size-5 shrink-0 transition-transform group-hover:scale-105"
                    />
                  </div>
                  <span
                    class="text-xs mt-0.5 text-center truncate max-w-full leading-tight"
                    :class="[isParentActive(item) ? 'text-primary font-medium' : 'text-muted font-normal group-hover:text-highlighted']"
                  >
                    {{ item.label }}
                  </span>
                </button>

                <template #content>
                  <div class="min-w-40 py-1 space-y-0.5">
                    <div class="px-2.5 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
                      {{ item.label }}
                    </div>
                    <NuxtLink
                      v-for="child in item.children"
                      :key="child.id"
                      :to="child.to"
                      class="flex items-center gap-2 px-2.5 py-1.5 text-sm transition-colors rounded-md"
                      :class="[
                        isItemActive(child)
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted font-normal hover:bg-muted hover:text-highlighted'
                      ]"
                    >
                      <UIcon
                        v-if="child.icon"
                        :name="child.icon"
                        class="size-4 shrink-0"
                        :class="[isItemActive(child) ? 'text-primary' : 'text-muted']"
                      />
                      <span>{{ child.label }}</span>
                    </NuxtLink>
                  </div>
                </template>
              </UPopover>
            </template>

            <!-- 2. DIRECT SINGLE ITEM -->
            <template v-else>
              <!-- Mobile Direct Link -->
              <NuxtLink
                :to="item.to"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer group lg:hidden"
                :class="[isItemActive(item) ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-muted/50 hover:text-highlighted']"
                @click="closeMobileMenu"
              >
                <UIcon
                  v-if="item.icon"
                  :name="item.icon"
                  class="size-4 shrink-0"
                  :class="[isItemActive(item) ? 'text-primary' : 'text-muted']"
                />
                <span
                  class="text-sm leading-tight truncate"
                  :class="[isItemActive(item) ? 'text-primary font-medium' : 'text-muted font-normal']"
                >
                  {{ item.label }}
                </span>
              </NuxtLink>

              <!-- Desktop Direct Link -->
              <NuxtLink
                :to="item.to"
                class="hidden lg:flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group"
                :class="[isItemActive(item) ? 'text-primary' : 'text-muted hover:text-highlighted']"
              >
                <div
                  class="w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                  :class="[
                    isItemActive(item)
                      ? 'bg-primary/10 text-primary shadow-xs'
                      : 'text-muted group-hover:bg-muted/60 group-hover:text-highlighted'
                  ]"
                >
                  <UIcon
                    v-if="item.icon"
                    :name="item.icon"
                    class="size-5 shrink-0 transition-transform group-hover:scale-105"
                  />
                </div>
                <span
                  class="text-xs mt-0.5 text-center truncate max-w-full leading-tight"
                  :class="[isItemActive(item) ? 'text-primary font-medium' : 'text-muted font-normal group-hover:text-highlighted']"
                >
                  {{ item.label }}
                </span>
              </NuxtLink>
            </template>
          </template>
        </template>
      </nav>

      <!-- Bottom Nav Section -->
      <div class="shrink-0 pt-2 space-y-1">
        <template
          v-for="item in bottomNavItems"
          :key="item.id"
        >
          <!-- Desktop Bottom Item -->
          <NuxtLink
            :to="item.to"
            class="hidden lg:flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group"
            :class="[isItemActive(item) ? 'text-primary' : 'text-muted hover:text-highlighted']"
          >
            <div
              class="w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200"
              :class="[
                isItemActive(item)
                  ? 'bg-primary/10 text-primary shadow-xs'
                  : 'text-muted group-hover:bg-muted/60 group-hover:text-highlighted'
              ]"
            >
              <UIcon
                v-if="item.icon"
                :name="item.icon"
                class="size-5 shrink-0 transition-transform group-hover:scale-105"
              />
            </div>
            <span
              class="text-xs mt-0.5 text-center truncate max-w-full leading-tight"
              :class="[isItemActive(item) ? 'text-primary font-medium' : 'text-muted font-normal group-hover:text-highlighted']"
            >
              {{ item.label }}
            </span>
          </NuxtLink>
        </template>

        <!-- Mobile User Settings -->
        <div class="lg:hidden">
          <UserPopover :popover-props="{ content: { side: 'top', sideOffset: 8, align: 'start' } }">
            <button
              class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors cursor-pointer text-muted hover:bg-muted/50 hover:text-highlighted group"
              :aria-label="$t('components.sidebar.settings')"
            >
              <UIcon
                name="i-lucide-settings"
                class="size-4 shrink-0 text-muted group-hover:text-highlighted"
              />
              <span class="text-sm font-normal leading-tight truncate text-left">
                {{ $t('components.sidebar.settings') }}
              </span>
            </button>
          </UserPopover>
        </div>

        <!-- Desktop User Settings -->
        <div class="hidden lg:flex flex-col items-center">
          <UserPopover :popover-props="{ content: { side: 'right', sideOffset: 12, align: 'end' } }">
            <button
              class="flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group text-muted hover:text-highlighted"
              :aria-label="$t('components.sidebar.settings')"
            >
              <div class="w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 text-muted group-hover:bg-muted/60 group-hover:text-highlighted">
                <UIcon
                  name="i-lucide-settings"
                  class="size-5 shrink-0 transition-transform group-hover:scale-105"
                />
              </div>
              <span class="text-xs font-normal mt-0.5 text-center truncate max-w-full leading-tight text-muted group-hover:text-highlighted">
                {{ $t('components.sidebar.settings') }}
              </span>
            </button>
          </UserPopover>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
const { navGroups, bottomNavItems, isItemActive, isParentActive, isExpanded, toggleExpanded } = useNavigation()
const isMobileMenuOpen = useState('isMobileMenuOpen', () => false)

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>
