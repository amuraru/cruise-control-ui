// Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information.

import { createApp } from 'vue'
import Axios from 'axios'
import App from './App'
import Api from './api'
import router from './router'
import store from './store'
import formatters from './formatters'
import Exception from '@/components/Exception'
import AsyncTask from '@/components/AsyncTask'
import { currentTheme, setTheme } from './themes'
import 'bootstrap/js/dist/dropdown'

setTheme(currentTheme.value)

const app = createApp(App)

app.use(store)
app.use(router)
app.component('exception', Exception)
app.component('async-task', AsyncTask)

app.config.globalProperties.$http = Axios
app.config.globalProperties.$helpers = Api
app.config.globalProperties.$formatters = formatters

router.isReady().then(() => app.mount('#app'))
