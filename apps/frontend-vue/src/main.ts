import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { Toaster } from 'vue-sonner'

import App from './App.vue'
import router from './router'

import './assets/styles/global.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.component('Toaster', Toaster)

app.mount('#app')
