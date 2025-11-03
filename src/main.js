// Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information.

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Api from './api'
import Exception from '@/components/Exception.vue'
import AsyncTask from '@/components/AsyncTask.vue'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import axios from 'axios'
import { useFilters } from '@/composables/useFilters'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize global store for API helper
import { useAppStore } from '@/store'
const store = useAppStore()
Api.setGlobalStore(store)

app.component('exception', Exception)
app.component('async-task', AsyncTask)

app.config.globalProperties.$http = axios
app.config.globalProperties.$helpers = Api

// Make filters available globally
const filters = useFilters()
app.config.globalProperties.$filters = filters

// Also provide individual filter functions for easier access
Object.keys(filters).forEach(key => {
  app.config.globalProperties[`$${key}`] = filters[key]
})

app.mount('#app')
