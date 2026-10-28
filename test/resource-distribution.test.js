import { expect, test } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ResourceDistribution from '../src/components/ResourceDistribution.vue'
import store from '../src/store'
import api from '../src/api'

test('topic data, filtering and stacked chart axes track the selected resource', async () => {
  store.commit('config', { east: { alpha: '/kafkacruisecontrol' } })
  const wrapper = mount(ResourceDistribution, {
    props: { group: 'east', cluster: 'alpha' },
    global: {
      plugins: [store],
      stubs: { LineChart: { props: ['chartData', 'options'], template: '<div />' } },
      mocks: {
        $helpers: api,
        $http: {
          get: async () => ({
            data: {
              records: [
                { topic: 'orders', leader: 1, followers: [2], cpu: 3, disk: 10 },
                { topic: 'orders', leader: 2, followers: [1], cpu: 5, disk: 20 },
                { topic: 'events', leader: 1, followers: [], cpu: 2, disk: 5 }
              ]
            }
          })
        }
      }
    }
  })
  await flushPromises()
  expect(wrapper.findAll('.col-4 > .card.mt-4')).toHaveLength(2)
  expect(wrapper.vm.formatStackedData.labels).toEqual([1, 2])
  expect(wrapper.vm.formatStackedData.datasets[0].data).toEqual([1, 1])
  expect(wrapper.vm.getStackedOptions.scales.x.stacked).toBe(true)
  expect(wrapper.vm.getStackedOptions.scales.y.stacked).toBe(true)
  expect(wrapper.vm.getStackedOptions.plugins.legend.position).toBe('bottom')
  wrapper.vm.setResource('cpu')
  await wrapper.vm.$nextTick()
  expect(wrapper.vm.formatStackedData.datasets[0].data).toEqual([3, 5])
  expect(wrapper.vm.getStackedOptions.scales.y.title.text).toBe('% cpu')
  await wrapper.find('input[type="text"]').setValue('events')
  const topicCards = wrapper.findAll('.col-4 > .card.mt-4')
  expect(topicCards[0].element.parentElement.style.display).toBe('none')
  expect(topicCards[1].element.parentElement.style.display).not.toBe('none')
  await wrapper.find('input[type="checkbox"]').setValue(true)
  expect(wrapper.find('input[type="text"]').attributes('disabled')).toBeDefined()
  wrapper.unmount()
})
