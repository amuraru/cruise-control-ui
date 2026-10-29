import { expect, test } from '@playwright/test'
import { mockCruiseControl } from '../fixtures/cruise-control'

test.beforeEach(async ({ page }) => {
  await mockCruiseControl(page)
  await page.goto('./#/')
})

async function request (page, endpoint, method = 'GET', headers = {}) {
  return page.evaluate(async ({ endpoint, method, headers }) => {
    const response = await fetch(`/kafkacruisecontrol/${endpoint}`, { method, headers })
    const text = await response.text()
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      taskId: response.headers.get('user-task-id'),
      body: response.headers.get('content-type').includes('application/json') ? JSON.parse(text) : text
    }
  }, { endpoint, method, headers })
}

test('load responses use the server JSON envelope and UUID task header', async ({ page }) => {
  const response = await request(page, 'load?json=true')
  expect(response.status).toBe(200)
  expect(response.contentType).toMatch(/^application\/json.*charset=utf-8/i)
  expect(response.taskId).toMatch(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i)
  expect(response.body).toEqual(expect.objectContaining({
    version: 1,
    hosts: expect.any(Array),
    brokers: expect.any(Array)
  }))
  expect(response.body.brokers[0]).toEqual(expect.objectContaining({
    Broker: expect.any(Number),
    Rack: expect.any(String),
    DiskCapacityMB: expect.any(Number)
  }))
})

test('broker POST responses are optimization results, not acknowledgement messages', async ({ page }) => {
  const response = await request(page, 'rebalance?json=true&dryrun=true', 'POST')
  expect(response.status).toBe(200)
  expect(response.body).toEqual(expect.objectContaining({
    version: 1,
    summary: expect.any(Object),
    goalSummary: expect.any(Array),
    loadAfterOptimization: expect.any(Object)
  }))
  expect(response.body).not.toHaveProperty('message')
  expect(response.body).not.toHaveProperty('loadBeforeOptimization')
})

test('demotion without json=true returns a plaintext optimization result', async ({ page }) => {
  const response = await request(page, 'demote_broker?brokerid=1&dryrun=true', 'POST')
  expect(response.status).toBe(200)
  expect(response.contentType).toMatch(/^text\/plain.*charset=utf-8/i)
  expect(response.body).toContain('Cluster load after demoting broker')
})

test('state responses honor the requested substate and task lists retain server types', async ({ page }) => {
  const response = await request(page, 'state?json=true&substates=MONITOR')
  expect(Object.keys(response.body).sort()).toEqual(['MonitorState', 'version'])
  expect(response.body.MonitorState.trained).toBe(true)
  const tasks = await request(page, 'user_tasks?json=true')
  expect(tasks.body.userTasks[0].StartMs).toBe('1700000000000')
  expect(tasks.body.userTasks[0].UserTaskId).toMatch(/^[0-9a-f-]{36}$/)
})

for (const [endpoint, method, status] of [
  ['load?json=true&granularity=replica', 'GET', 400],
  ['remove_disks?json=true&skip_hard_goal_check=true', 'POST', 400],
  ['rebalance?json=true', 'GET', 404],
  ['missing_endpoint?json=true', 'POST', 404],
  ['add_broker?json=true&dryrun=true', 'POST', 400],
  ['rebalance?json=true&concurrent_leader_movements=0', 'POST', 400],
  ['rebalance?json=true&kafka_assigner=true&goals=RackAwareGoal', 'POST', 400]
]) {
  test(`${method} ${endpoint} follows the server HTTP ${status} error contract`, async ({ page }) => {
    const response = await request(page, endpoint, method)
    expect(response.status).toBe(status)
    expect(response.contentType).toContain('application/json')
    expect(response.body).toEqual({
      version: 1,
      errorMessage: expect.any(String),
      stackTrace: expect.any(String)
    })
  })
}

test('task headers resume the same request and cannot be reused for another operation', async ({ page }) => {
  const first = await request(page, 'load?json=true')
  const headers = { 'User-Task-ID': first.taskId }
  const resumed = await request(page, 'load?json=true', 'GET', headers)
  expect(resumed.status).toBe(200)
  expect(resumed.taskId).toBe(first.taskId)
  const unrelated = await request(page, 'proposals?json=true', 'GET', headers)
  expect(unrelated.status).toBe(400)
  expect(unrelated.body.errorMessage).toContain('User-Task-ID')
})
