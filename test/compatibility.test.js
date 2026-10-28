import assert from 'node:assert/strict'
import { test } from 'vitest'
import { mount } from '@vue/test-utils'
import api from '../src/api'
import store from '../src/store'
import AsyncTask from '../src/components/AsyncTask.vue'
import formatters from '../src/formatters'

test('API URLs preserve the configured prefix with or without a trailing slash', () => {
  for (const base of ['https://example.test/kafkacruisecontrol', 'https://example.test/kafkacruisecontrol/']) {
    store.commit('seturl', base)
    const url = new URL(api.getURL('state', { substates: 'MONITOR' }))
    assert.equal(url.pathname, '/kafkacruisecontrol/state')
    assert.equal(url.searchParams.get('json'), 'true')
    assert.equal(url.searchParams.get('substates'), 'MONITOR')
  }
})

test('legacy UI endpoint names resolve to the current Cruise Control routes', () => {
  store.commit('seturl', 'https://example.test/kafkacruisecontrol')
  for (const [endpoint, pathname] of [
    ['partitionload', '/kafkacruisecontrol/partition_load'],
    ['replicaload', '/kafkacruisecontrol/load'],
    ['remove_disks', '/kafkacruisecontrol/remove_disks']
  ]) {
    assert.equal(new URL(api.getURL(endpoint)).pathname, pathname)
  }
})

test('API query parameters preserve topic characters and explicit JSON selection', () => {
  store.commit('seturl', 'https://example.test/kafkacruisecontrol')
  const url = new URL(api.getURL('partitionload', { topic: 'orders.eu+archive', json: false }))
  assert.equal(url.searchParams.get('topic'), 'orders.eu+archive')
  assert.equal(url.searchParams.get('json'), 'false')
})

test('async progress accepts the current nested operation response', () => {
  const wrapper = mount(AsyncTask, {
    global: { mocks: { $formatters: formatters } },
    props: {
      asyncData: {
        version: 1,
        progress: [{
          operation: 'Getting proposals',
          operationProgress: [
            { step: 'AGGREGATING_METRICS', description: 'Collecting metrics', completionPercentage: 100, 'time-in-ms': 20 },
            { step: 'OPTIMIZING', description: 'Optimizing', completionPercentage: 0, 'time-in-ms': 5 }
          ]
        }]
      }
    }
  })
  const vm = wrapper.vm
  try {
    assert.equal(vm.isParsed, true)
    assert.equal(vm.steps.length, 2)
    assert.equal(vm.steps[0].label, 'Getting proposals')
    assert.equal(vm.steps[1].step, 'OPTIMIZING')
    assert.equal(vm.totalCompletion, 50)
    assert.equal(vm.totalTime, 25)
    assert.match(wrapper.text(), /25 ms/)
  } finally {
    wrapper.unmount()
  }
})

test('async progress retains support for older flat responses', () => {
  const wrapper = mount(AsyncTask, {
    global: { mocks: { $formatters: formatters } },
    props: {
      asyncData: {
        progress: [
          { step: 'OPTIMIZING', description: 'Optimizing', completionPercentage: 75, 'time-in-ms': 10 }
        ]
      }
    }
  })
  const vm = wrapper.vm
  try {
    assert.equal(vm.steps[0].label, 'Async Task')
    assert.equal(vm.totalCompletion, 75)
    assert.equal(vm.totalTime, 10)
  } finally {
    wrapper.unmount()
  }
})
