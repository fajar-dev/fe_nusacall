<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="relative h-full shrink-0">
    <aside class="flex flex-col h-full bg-default border-r border-default shrink-0 justify-between select-none w-24 px-1 py-3">
      <!-- Top Section: App/Brand Logo Header -->
      <div class="flex flex-col items-center pb-6 pt-1.5 shrink-0 gap-1">
        <BrandLogo :is-collapsed="true" />
      </div>

      <USeparator
        class="px-5 mt-1"
        size="sm"
      />
      <!-- Navigation Menus (Scrollable middle area) -->
      <nav class="flex-1 overflow-y-auto min-h-0 py-2.5 space-y-1 pt-6 scrollbar-thin flex flex-col items-center">
        <template
          v-for="group in navGroups"
          :key="group.id || group.title"
        >
          <template
            v-for="item in group.items"
            :key="item.id"
          >
            <!-- Item WITH children (popover flyout submenu) -->
            <UPopover
              v-if="item.children && item.children.length"
              :content="{ side: 'right', sideOffset: 12, align: 'start' }"
              :ui="{ content: 'p-1' }"
              mode="hover"
            >
              <button
                class="flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group"
                :class="[isParentActive(item) ? 'text-primary font-medium' : 'text-muted hover:text-highlighted']"
              >
                <div
                  class="w-14 h-8.5 rounded-full flex items-center justify-center transition-all duration-200"
                  :class="[
                    isParentActive(item)
                      ? 'bg-primary/10 text-primary shadow-xs'
                      : 'text-muted group-hover:bg-muted/60 group-hover:text-highlighted'
                  ]"
                >
                  <UIcon
                    v-if="item.icon"
                    :name="item.icon"
                    class="w-[22px] h-[22px] shrink-0 transition-transform group-hover:scale-105"
                  />
                </div>
                <span
                  class="text-xs font-medium mt-0.5 text-center truncate max-w-full leading-tight"
                  :class="[isParentActive(item) ? 'text-primary font-semibold' : 'text-muted group-hover:text-highlighted']"
                >
                  {{ item.label }}
                </span>
              </button>

              <template #content>
                <div class="min-w-44 py-1.5">
                  <div class="px-3 py-1 text-xs font-bold text-muted uppercase tracking-wider">
                    {{ item.label }}
                  </div>
                  <NuxtLink
                    v-for="child in item.children"
                    :key="child.id"
                    :to="child.to"
                    class="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors rounded-md"
                    :class="[
                      isItemActive(child)
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted hover:bg-muted hover:text-highlighted'
                    ]"
                  >
                    <UIcon
                      v-if="child.icon"
                      :name="child.icon"
                      class="w-4 h-4 shrink-0"
                      :class="[isItemActive(child) ? 'text-primary' : 'text-muted']"
                    />
                    <span>{{ child.label }}</span>
                  </NuxtLink>
                </div>
              </template>
            </UPopover>

            <!-- Item WITHOUT children (regular link) -->
            <NuxtLink
              v-else
              :to="item.to"
              class="flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group"
              :class="[isItemActive(item) ? 'text-primary font-medium' : 'text-muted hover:text-highlighted']"
            >
              <div
                class="w-14 h-8.5 rounded-full flex items-center justify-center transition-all duration-200"
                :class="[
                  isItemActive(item)
                    ? 'bg-primary/10 text-primary shadow-xs'
                    : 'text-muted group-hover:bg-muted/60 group-hover:text-highlighted'
                ]"
              >
                <UIcon
                  v-if="item.icon"
                  :name="item.icon"
                  class="w-[22px] h-[22px] shrink-0 transition-transform group-hover:scale-105"
                />
              </div>
              <span
                class="text-xs font-medium mt-0.5 text-center truncate max-w-full leading-tight"
                :class="[isItemActive(item) ? 'text-primary font-semibold' : 'text-muted group-hover:text-highlighted']"
              >
                {{ item.label }}
              </span>
            </NuxtLink>
          </template>
        </template>
      </nav>

      <!-- Bottom Section (Fixed at bottom) -->
      <div class="shrink-0 pt-2.5 flex flex-col items-center space-y-1">
        <template
          v-for="item in bottomNavItems"
          :key="item.id"
        >
          <NuxtLink
            :to="item.to"
            class="flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group"
            :class="[isItemActive(item) ? 'text-primary font-medium' : 'text-muted hover:text-highlighted']"
          >
            <div
              class="w-14 h-8.5 rounded-full flex items-center justify-center transition-all duration-200"
              :class="[
                isItemActive(item)
                  ? 'bg-primary/10 text-primary shadow-xs'
                  : 'text-muted group-hover:bg-muted/60 group-hover:text-highlighted'
              ]"
            >
              <UIcon
                v-if="item.icon"
                :name="item.icon"
                class="w-[22px] h-[22px] shrink-0 transition-transform group-hover:scale-105"
              />
            </div>
            <span
              class="text-xs font-medium mt-0.5 text-center truncate max-w-full leading-tight"
              :class="[isItemActive(item) ? 'text-primary font-semibold' : 'text-muted group-hover:text-highlighted']"
            >
              {{ item.label }}
            </span>
          </NuxtLink>
        </template>

        <!-- Settings Popover -->
        <UserPopover :popover-props="{ content: { side: 'right', sideOffset: 12, align: 'end' } }">
          <button
            class="flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group text-muted hover:text-highlighted"
            :aria-label="$t('components.sidebar.settings')"
          >
            <div
              class="w-14 h-8.5 rounded-full flex items-center justify-center transition-all duration-200 text-muted group-hover:bg-muted/60 group-hover:text-highlighted"
            >
              <UIcon
                name="i-lucide-settings"
                class="w-[22px] h-[22px] shrink-0 transition-transform group-hover:scale-105"
              />
            </div>
            <span class="text-xs font-medium mt-0.5 text-center truncate max-w-full leading-tight text-muted group-hover:text-highlighted">
              {{ $t('components.sidebar.settings') }}
            </span>
          </button>
        </UserPopover>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
const { navGroups, bottomNavItems, isItemActive, isParentActive } = useNavigation()
</script>
