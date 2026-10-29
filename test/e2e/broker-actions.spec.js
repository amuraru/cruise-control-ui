import { expect, test } from '@playwright/test'
import { mockCruiseControl } from '../fixtures/cruise-control'

const actions = [
  {
    name: 'ple',
    heading: 'PLE Flags',
    endpoint: 'rebalance',
    params: { dryrun: 'true', goals: 'PreferredLeaderElectionGoal', json: 'true' }
  },
  {
    name: 'rebalance',
    heading: 'Rebalance Cluster Flags',
    endpoint: 'rebalance',
    params: { dryrun: 'true', json: 'true' }
  },
  {
    name: 'rebalance_disk',
    heading: 'Rebalance Broker Disks',
    endpoint: 'rebalance',
    params: { dryrun: 'true', rebalance_disk: 'true', json: 'true' }
  },
  {
    name: 'add',
    heading: 'Add Broker Flags',
    endpoint: 'add_broker',
    params: { dryrun: 'true', brokerid: '1,2', throttle_added_broker: 'true', json: 'true' }
  },
  {
    name: 'remove',
    heading: 'Remove Broker Flags',
    endpoint: 'remove_broker',
    params: { dryrun: 'true', brokerid: '1,2', throttle_removed_broker: 'true', json: 'true' }
  },
  {
    name: 'demote',
    heading: 'Demote Broker Flags',
    endpoint: 'demote_broker',
    params: { dryrun: 'true', brokerid: '1,2' }
  },
  {
    name: 'remove_disks',
    heading: 'Remove Disk Flags',
    endpoint: 'remove_disks',
    params: { dryrun: 'true', brokerid_and_logdirs: '1-/data/a,2-/data/b', json: 'true' }
  }
]

let errors

test.beforeEach(async ({ page }) => {
  errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await mockCruiseControl(page)
  await page.goto('./#/east/alpha/admin_broker')
})

test.afterEach(() => {
  expect(errors).toEqual([])
})

function control (panel, label) {
  return panel.locator('label').filter({ hasText: label }).locator('..').locator('input, select')
}

async function selectAction (page, action) {
  if (action.params.brokerid) {
    const brokers = page.locator('#page tbody input[type="checkbox"]')
    await brokers.nth(0).check()
    await brokers.nth(1).check()
  }
  await page.locator(`input[type="radio"][value="${action.name}"]`).check()
  const panel = page.getByRole('heading', { name: action.heading, exact: true }).locator('..')
  if (action.name === 'remove_disks') {
    await control(panel, /Disks as broker_id/).fill('1-/data/a,2-/data/b')
  }
  return panel
}

async function submit (page, panel, endpoint, params) {
  const posted = page.waitForResponse(response => response.request().method() === 'POST')
  await panel.getByRole('button').click()
  const response = await posted
  expect(response.status()).toBe(200)
  const request = response.request()
  const url = new URL(request.url())
  expect(url.pathname).toBe(`/kafkacruisecontrol/${endpoint}`)
  expect(Object.fromEntries(url.searchParams)).toEqual(params)
  await expect(page.getByRole('button', { name: 'Clear Response', exact: true })).toBeVisible()
  await expect(page.locator('#page')).toContainText(endpoint === 'demote_broker' ? 'Cluster load after demoting broker' : 'loadAfterOptimization')
  return response
}

for (const action of actions) {
  test(`${action.name} submits safe defaults and honors explicit dry-run changes`, async ({ page }) => {
    const panel = await selectAction(page, action)
    const dryrun = control(panel, /^\s*Dry\s*Run\s*$/i)
    await expect(dryrun).toBeChecked()
    await submit(page, panel, action.endpoint, action.params)
    await dryrun.uncheck()
    await submit(page, panel, action.endpoint, { ...action.params, dryrun: 'false' })
    await dryrun.check()
    await submit(page, panel, action.endpoint, action.params)
  })
}

for (const action of actions.filter(action => ['rebalance', 'add', 'remove'].includes(action.name))) {
  test(`${action.name} submits advanced options and clears hidden options`, async ({ page }) => {
    const panel = await selectAction(page, action)
    const advanced = control(panel, 'Show All Options')
    await advanced.check()
    await panel.locator('input[value="RackAwareGoal"]').check()
    await panel.locator('input[value="DiskCapacityGoal"]').check()
    await control(panel, 'Disallow Capacity Estimation').check()
    await control(panel, 'Skip Hard Goal Check').check()
    await control(panel, 'Use Data From:').selectOption('valid_partitions')
    await control(panel, 'Excluded Topics').fill('orders.eu+archive|metrics&debug')
    await control(panel, 'Concurrent Partition Movements Per Broker:').fill('3')
    await control(panel, 'Concurrent Leader Movements:').fill('7')
    await control(panel, /^\s*Dryrun\s*$/i).uncheck()
    const throttle = action.name === 'add'
      ? { throttle_added_broker: 'false' }
      : action.name === 'remove' ? { throttle_removed_broker: 'false' } : {}
    if (action.name !== 'rebalance') {
      await expect(control(panel, /Throttle/)).toBeChecked()
      await control(panel, /Throttle/).uncheck()
    }
    await submit(page, panel, action.endpoint, {
      ...action.params,
      dryrun: 'false',
      goals: 'RackAwareGoal,DiskCapacityGoal',
      allow_capacity_estimation: 'false',
      skip_hard_goal_check: 'true',
      data_from: 'valid_partitions',
      excluded_topics: 'orders.eu+archive|metrics&debug',
      concurrent_partition_movements_per_broker: '3',
      concurrent_leader_movements: '7',
      ...throttle
    })
    await advanced.uncheck()
    await expect(control(panel, /^\s*Dry\s*Run\s*$/i)).not.toBeChecked()
    await submit(page, panel, action.endpoint, { ...action.params, dryrun: 'false' })
  })

  test(`${action.name} enforces exclusive default-goal and Kafka assigner modes`, async ({ page }) => {
    const panel = await selectAction(page, action)
    await control(panel, 'Show All Options').check()
    const ready = control(panel, 'Use Ready Default Goals')
    const assigner = control(panel, 'Kafka Assigner Mode')
    const skip = control(panel, 'Skip Hard Goal Check')
    const goal = panel.locator('input[value="RackAwareGoal"]')
    await ready.check()
    await expect(goal).toBeDisabled()
    await expect(assigner).toBeDisabled()
    await submit(page, panel, action.endpoint, { ...action.params, use_ready_default_goals: 'true' })
    await ready.uncheck()
    await assigner.check()
    await expect(goal).toBeDisabled()
    await expect(ready).toBeDisabled()
    await expect(skip).toBeDisabled()
    await submit(page, panel, action.endpoint, { ...action.params, kafka_assigner: 'true' })
    await assigner.uncheck()
    await goal.check()
    await expect(ready).toBeDisabled()
    await expect(assigner).toBeDisabled()
    await submit(page, panel, action.endpoint, { ...action.params, goals: 'RackAwareGoal' })
  })
}

for (const action of actions.filter(action => ['ple', 'demote'].includes(action.name))) {
  test(`${action.name} submits leader concurrency and capacity options`, async ({ page }) => {
    const panel = await selectAction(page, action)
    await control(panel, 'Concurrent Leader Movements').fill('11')
    const capacity = action.name === 'demote' ? { allow_capacity_estimation: 'false' } : {}
    if (action.name === 'demote') await control(panel, 'Disallow Capacity Estimation').check()
    await submit(page, panel, action.endpoint, {
      ...action.params,
      concurrent_leader_movements: '11',
      ...capacity
    })
  })
}

test('remove_disks preserves disk separators and spaces inside log directory paths', async ({ page }) => {
  const action = actions.find(action => action.name === 'remove_disks')
  const panel = await selectAction(page, action)
  await control(panel, /Disks as broker_id/).fill(' 1-/data/primary, 2-/data/with space, 1-/data/archive ')
  await submit(page, panel, action.endpoint, {
    ...action.params,
    brokerid_and_logdirs: '1-/data/primary,2-/data/with space,1-/data/archive'
  })
})

test('remove_disks does not inherit unsupported hard-goal flags from rebalance', async ({ page }) => {
  const rebalance = actions.find(action => action.name === 'rebalance')
  const rebalancePanel = await selectAction(page, rebalance)
  await control(rebalancePanel, 'Show All Options').check()
  await control(rebalancePanel, 'Skip Hard Goal Check').check()
  const disks = actions.find(action => action.name === 'remove_disks')
  const diskPanel = await selectAction(page, disks)
  await submit(page, diskPanel, disks.endpoint, disks.params)
})

test('broker selection gates broker-specific and cluster-wide actions', async ({ page }) => {
  for (const name of ['add', 'remove', 'demote']) {
    await expect(page.locator(`input[value="${name}"]`)).toBeDisabled()
  }
  const brokers = page.locator('#page tbody input[type="checkbox"]')
  await brokers.first().check()
  await expect(page.locator('input[value="add"]')).toBeChecked()
  for (const name of ['ple', 'rebalance', 'rebalance_disk', 'remove_disks']) {
    await expect(page.locator(`input[value="${name}"]`)).toBeDisabled()
  }
  await brokers.first().uncheck()
  await expect(page.locator('input[value="ple"]')).toBeChecked()
  for (const name of ['add', 'remove', 'demote']) {
    await expect(page.locator(`input[value="${name}"]`)).toBeDisabled()
  }
})

test('repeat broker submissions send the task ID as a header, not a JSON body', async ({ page }) => {
  const action = actions[0]
  const panel = await selectAction(page, action)
  const first = await submit(page, panel, action.endpoint, action.params)
  expect.soft(first.request().postData()).toBeNull()
  const repeated = await submit(page, panel, action.endpoint, action.params)
  expect.soft(repeated.request().headers()['user-task-id']).toBe(first.headers()['user-task-id'])
  expect.soft(repeated.request().postData()).toBeNull()
})
