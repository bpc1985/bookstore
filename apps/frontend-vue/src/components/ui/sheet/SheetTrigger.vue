<script setup lang="ts">
import type { DialogTriggerProps } from 'radix-vue'
import { DialogTrigger, useForwardProps } from 'radix-vue'

const props = defineProps<DialogTriggerProps>()

const forwardedProps = useForwardProps(props)
</script>

<template>
  <DialogTrigger v-bind="forwardedProps">
    <slot />
  </DialogTrigger>
</template>
