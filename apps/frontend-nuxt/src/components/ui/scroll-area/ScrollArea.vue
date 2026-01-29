<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb } from 'radix-vue'
import type { HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <ScrollAreaRoot
    :class="cn('relative overflow-hidden', props.class)"
  >
    <ScrollAreaScrollbar
      orientation="horizontal"
      class="flex h-2 w-full touch-none select-none border-t border-transparent p-[1px] transition-colors hover:border-border data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-l data-[orientation=vertical]:border-t-0"
    >
      <ScrollAreaThumb
        class="relative flex-1 rounded-full bg-border hover:bg-muted-foreground/50"
      />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar
      orientation="vertical"
      class="flex h-2 w-full touch-none select-none border-t border-transparent p-[1px] transition-colors hover:border-border data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-l data-[orientation=vertical]:border-t-0"
    >
      <ScrollAreaThumb
        class="relative flex-1 rounded-full bg-border hover:bg-muted-foreground/50"
      />
    </ScrollAreaScrollbar>
    <slot />
  </ScrollAreaRoot>
</template>
