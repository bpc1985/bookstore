<script setup lang="ts">
import { DropdownMenuTrigger as RadixDropdownMenuTrigger, useForwardProps, type DropdownMenuTriggerProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'

const props = defineProps<DropdownMenuTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RadixDropdownMenuTrigger v-bind="forwardedProps" :class="props.class">
    <slot />
  </RadixDropdownMenuTrigger>
</template>
