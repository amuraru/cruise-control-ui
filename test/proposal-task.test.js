import { beforeEach, expect, test } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Proposals from '../src/components/Proposals.vue'
import store from '../src/store'
import api from '../src/api'
import { progress, proposals } from './fixtures/cruise-control'

beforeEach(() => {
  store.commit('seturl', '/kafkacruisecontrol')
  store.commit('setTaskId', { url: api.getURL('proposals', { verbose: true }), taskid: null })
})

function mountProposals (get) {
  return mount(Proposals, {
    props: { group: 'east', cluster: 'alpha' },
    global: { plugins: [store], mocks: { $helpers: api, $http: { get } } }
  })
}

const headers = { 'content-type': 'application/json', 'user-task-id': 'proposal-task' }

test('completed proposals release the task ID before another request', async () => {
  let requests = 0
  const wrapper = mountProposals(async (url, options) => {
    requests++
    if (requests === 1) return { data: progress, headers }
    if (requests > 2 && options.headers?.['User-Task-ID']) {
      throw new Error('Completed task has been evicted')
    }
    return { data: proposals, headers }
  })
  await flushPromises()
  await wrapper.find('button').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('Proposal Changes')
  wrapper.vm.getProposals()
  await flushPromises()
  expect(wrapper.text()).toContain('Proposal Changes')
  expect(wrapper.vm.error).toBe(false)
})

test('an explicitly expired proposal task retries without the rejected header', async () => {
  store.commit('setTaskId', { url: api.getURL('proposals', { verbose: true }), taskid: 'proposal-task' })
  let requests = 0
  const wrapper = mountProposals(async (url, options) => {
    requests++
    if (options.headers?.['User-Task-ID']) {
      throw {
        response: {
          status: 400,
          data: { errorMessage: 'Unexpected header proposal-task (value: User-Task-ID) in the request.' }
        }
      }
    }
    return { data: proposals, headers }
  })
  await flushPromises()
  expect(wrapper.text()).toContain('Proposal Changes')
  expect(requests).toBe(2)
})

for (const status of [400, 503]) {
  test(`HTTP ${status} without an expired-task error retains an active proposal task`, async () => {
    const url = api.getURL('proposals', { verbose: true })
    store.commit('setTaskId', { url, taskid: 'proposal-task' })
    let requests = 0
    const wrapper = mountProposals(async () => {
      requests++
      throw { response: { status, data: { errorMessage: 'Temporarily unavailable' } } }
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Temporarily unavailable')
    expect(store.getters.getTaskId(url)).toBe('proposal-task')
    expect(requests).toBe(1)
  })
}

test('a late proposal response does not clear a newer task ID', async () => {
  const url = api.getURL('proposals', { verbose: true })
  store.commit('setTaskId', { url, taskid: 'older-task' })
  let finish
  const wrapper = mountProposals(() => new Promise(resolve => {
    finish = resolve
  }))
  store.commit('setTaskId', { url, taskid: 'newer-task' })
  finish({ data: proposals, headers })
  await flushPromises()
  expect(wrapper.text()).toContain('Proposal Changes')
  expect(store.getters.getTaskId(url)).toBe('newer-task')
})

test('expired task recovery retries at most once', async () => {
  const url = api.getURL('proposals', { verbose: true })
  store.commit('setTaskId', { url, taskid: 'proposal-task' })
  let requests = 0
  const wrapper = mountProposals(async () => {
    requests++
    throw {
      response: {
        status: 400,
        data: { errorMessage: 'Unexpected header proposal-task (value: User-Task-ID) in the request.' }
      }
    }
  })
  await flushPromises()
  expect(requests).toBe(2)
  expect(wrapper.text()).toContain('Unexpected header')
})

test('an expired response after unmount does not start another proposal request', async () => {
  const url = api.getURL('proposals', { verbose: true })
  store.commit('setTaskId', { url, taskid: 'proposal-task' })
  let reject
  let requests = 0
  const wrapper = mountProposals(() => {
    requests++
    return new Promise((resolve, fail) => {
      reject = fail
    })
  })
  wrapper.unmount()
  reject({
    response: {
      status: 400,
      data: { errorMessage: 'Unexpected header proposal-task (value: User-Task-ID) in the request.' }
    }
  })
  await flushPromises()
  expect(requests).toBe(1)
})
