import { afterEach } from 'vitest'
import { config, enableAutoUnmount } from '@vue/test-utils'
import AsyncTask from '../src/components/AsyncTask.vue'
import Exception from '../src/components/Exception.vue'
import formatters from '../src/formatters'

config.global.components = { 'async-task': AsyncTask, exception: Exception }
config.global.mocks.$formatters = formatters
enableAutoUnmount(afterEach)
