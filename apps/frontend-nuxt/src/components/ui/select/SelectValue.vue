<script setup lang="ts">
import { SelectValue as RadixSelectValue, type SelectValueProps } from 'radix-vue'
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<SelectValueProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <RadixSelectValue v-bind="delegatedProps" :class="cn('block', props.class)" />
</template>
