import { afterEach, expect, test, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import store from '../src/store'
import Offline from '../src/components/Offline.vue'
import AppNav from '../src/components/AppNav.vue'
import BrokerLoad from '../src/components/BrokerLoad.vue'
import Summary from '../src/components/Summary.vue'
import ReplicaLoad from '../src/components/ReplicaLoad.vue'
import Page from '../src/components/Page.vue'
import formatters from '../src/formatters'
import api from '../src/api'

afterEach(() => {
  store.commit('config', {})
  vi.useRealTimers()
})

test('adding and removing a task ID updates rendered state', async () => {
  const url = '/kafkacruisecontrol/load'
  const wrapper = mount({
    template: '<span>{{ $store.getters.getTaskId(url) || "none" }}</span>',
    data: () => ({ url })
  }, { global: { plugins: [store] } })

  store.commit('setTaskId', { url, taskid: 'task-123' })
  await nextTick()
  expect(wrapper.text()).toBe('task-123')
  store.commit('setTaskId', { url, taskid: null })
  await nextTick()
  expect(wrapper.text()).toBe('none')
  wrapper.unmount()
})

test('unmounting the offline indicator removes network listeners', async () => {
  store.commit('setonline', true)
  const wrapper = mount(Offline, { global: { plugins: [store] } })
  window.dispatchEvent(new Event('offline'))
  await nextTick()
  expect(wrapper.text()).toContain('disconnected')
  wrapper.unmount()
  store.commit('setonline', true)
  window.dispatchEvent(new Event('offline'))
  expect(store.state.online).toBe(true)
})

test('configuration fetch populates cluster links and cancels polling on unmount', async () => {
  vi.useFakeTimers()
  const wrapper = mount(AppNav, {
    global: {
      plugins: [store],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
      mocks: {
        $http: { get: async () => ({ data: 'east,alpha,/kafkacruisecontrol\nwest,beta,/other' }) }
      }
    }
  })
  await vi.waitFor(() => expect(wrapper.text()).toContain('alpha'))
  expect(wrapper.text()).toContain('beta')
  expect(store.state.config.east.alpha).toBe('/kafkacruisecontrol')
  wrapper.vm.reloadForever()
  expect(vi.getTimerCount()).toBe(1)
  wrapper.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

test('broker table preserves disk, network and host formatting and sorting', async () => {
  const broker = {
    BrokerState: 'ALIVE',
    Host: 'broker.example.com',
    CpuPct: 12.5,
    DiskMB: 2048,
    LeaderNwInRate: 2,
    FollowerNwInRate: 1,
    NwOutRate: 3,
    PnwOutRate: 4
  }
  const wrapper = mount(BrokerLoad, {
    props: { brokers: [{ ...broker, Broker: 1, Replicas: 9 }, { ...broker, Broker: 2, Replicas: 3 }] },
    global: { mocks: { $formatters: formatters } }
  })
  expect(wrapper.find('tbody tr').text()).toContain('2')
  expect(wrapper.text()).toContain('broker')
  expect(wrapper.text()).not.toContain('broker.example.com')
  expect(wrapper.text()).toContain('2.00 GB')
  expect(wrapper.text()).toContain('2 KBps')
  await wrapper.findAll('th').find(th => th.text() === 'ID').trigger('click')
  expect(wrapper.find('tbody tr td').text()).toBe('1')
  wrapper.unmount()
})

test('summary group selection renders only clusters in the selected group', async () => {
  store.commit('config', { east: { alpha: '/api-a' }, west: { beta: '/api-b' } })
  const wrapper = mount(Summary, {
    global: {
      plugins: [store],
      stubs: { SummaryRow: { props: ['cluster'], template: '<tr><td>{{ cluster }}</td></tr>' } }
    }
  })
  await wrapper.find('select').setValue('west')
  expect(wrapper.find('tbody').text()).toBe('beta')
  await wrapper.find('select').setValue('all')
  expect(wrapper.find('tbody').text()).toContain('alpha')
  wrapper.unmount()
})

test('replica rows and empty brokers render within their own loop scope', async () => {
  const wrapper = mount(ReplicaLoad, {
    global: { plugins: [store], mocks: { $formatters: formatters } }
  })
  await wrapper.setData({
    loaded: true,
    racks: [{
      rackid: 'rack-1',
      hosts: [{
        name: 'broker.example.com',
        brokers: [
          { brokerid: 1, replicas: [{ topic: 'orders', partition: 0, isLeader: true }] },
          { brokerid: 2, replicas: [] }
        ]
      }]
    }]
  })
  await flushPromises()
  expect(wrapper.text()).toContain('orders-0')
  expect(wrapper.text()).toContain('No replica details available.')
  wrapper.unmount()
})

test('cluster pages initialize API URLs after config loads and when the cluster changes', async () => {
  store.commit('seturl', null)
  const wrapper = mount(Page, {
    props: { group: 'east', cluster: 'alpha' },
    global: {
      plugins: [store],
      stubs: { RouterLink: true, RouterView: true }
    }
  })
  store.commit('config', { east: { alpha: '/kafkacruisecontrol', beta: '/beta/kafkacruisecontrol' } })
  await nextTick()
  expect(new URL(api.getURL('load')).pathname).toBe('/kafkacruisecontrol/load')
  await wrapper.setProps({ cluster: 'beta' })
  expect(new URL(api.getURL('load')).pathname).toBe('/beta/kafkacruisecontrol/load')
  wrapper.unmount()
})
