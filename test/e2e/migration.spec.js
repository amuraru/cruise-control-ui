import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { load, mockCruiseControl, partitionLoad, progress, proposals } from '../fixtures/cruise-control'

let errors

test.beforeEach(async ({ page }) => {
  errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await mockCruiseControl(page)
})

test.afterEach(() => {
  expect(errors).toEqual([])
})

test('production config CSV is preserved below the deployment subdirectory', async ({ request }) => {
  const response = await request.get('./static/config.csv')
  expect(response.ok()).toBe(true)
  expect(await response.body()).toEqual(readFileSync('static/config.csv'))
})

for (const [path, content] of [
  ['/a/b', 'To get started'],
  ['/preferences', 'Cruise Control UI - Preferences'],
  ['/configInsights', 'config.csv Insights'],
  ['/summary', 'Out of sync Replicas'],
  ['/east/alpha/kafka_cluster_state', 'No Offline Partitions'],
  ['/east/alpha/state', 'NO_TASK_IN_PROGRESS'],
  ['/east/alpha/state/monitor', 'TRAINED'],
  ['/east/alpha/state/analyzer', 'PROPOSALS_READY'],
  ['/east/alpha/state/anomaly_detector', 'Self Healing Status'],
  ['/east/alpha/load', '2.00 GB'],
  ['/east/alpha/replicaload', 'Show Me Replica Load Anyway.'],
  ['/east/alpha/partitionload', 'Show Partition Load'],
  ['/east/alpha/proposals', 'Proposal Changes'],
  ['/east/alpha/user_tasks', 'task-1'],
  ['/east/alpha/admin_state', 'Pause Sampling'],
  ['/east/alpha/admin_broker', 'Preferred Leader Election'],
  ['/east/alpha/review', 'Routine balance']
]) {
  test(`production deep link ${path}`, async ({ page }) => {
    await page.goto(`./#${path}`)
    await expect(page.locator('#page')).toContainText(content)
    if (path === '/summary') {
      await page.locator('#page select').selectOption('west')
      await expect(page.locator('#page tbody')).toContainText('gamma')
      await expect(page.locator('#page tbody')).not.toContainText('alpha')
    }
  })
}

test('hash navigation, active tabs and cluster switches use the selected backend', async ({ page }) => {
  await page.goto('./#/')
  await expect(page.locator('#page')).toContainText('To get started')
  await page.locator('nav .dropdown-toggle').filter({ hasText: 'east' }).click()
  await page.getByRole('link', { name: 'alpha', exact: true }).click()
  await expect(page).toHaveURL(/#\/east\/alpha\/kafka_cluster_state$/)
  await page.getByRole('link', { name: 'Cruise Control State', exact: true }).click()
  await expect(page).toHaveURL(/#\/east\/alpha\/state\/executor$/)
  await expect(page.getByRole('link', { name: 'Executor State', exact: true })).toHaveClass(/active/)
  await page.getByRole('link', { name: 'Kafka Cluster Load', exact: true }).click()
  await expect(page.locator('#page')).toContainText('2.00 GB')
  await page.locator('nav .dropdown-toggle').filter({ hasText: 'east' }).click()
  const response = page.waitForResponse(response => response.url().includes('/beta/kafkacruisecontrol/kafka_cluster_state'))
  await page.getByRole('link', { name: 'beta', exact: true }).click()
  await response
  await expect(page.locator('#page')).toContainText('east » beta')
  await page.goBack()
  await expect(page).toHaveURL(/#\/east\/alpha\/load$/)
  await expect(page.locator('#page')).toContainText('2.00 GB')
})

test('broker actions keep dry-run defaults and advanced goal controls', async ({ page }) => {
  await page.goto('./#/east/alpha/admin_broker')
  await page.locator('input[type="radio"][value="rebalance"]').check()
  const flags = page.locator('.alert.alert-info').filter({ hasText: 'Rebalance Cluster Flags' })
  await expect(flags.locator('input[type="checkbox"]').nth(1)).toBeChecked()
  const posted = page.waitForRequest(request => request.method() === 'POST' && request.url().includes('/rebalance?'))
  await flags.getByRole('button', { name: 'Execute Rebalance With Default Options' }).click()
  expect(new URL((await posted).url()).searchParams.get('dryrun')).toBe('true')
  await flags.locator('input[type="checkbox"]').first().check()
  await expect(flags).toContainText('Choose Goals')
  await expect(flags.locator('input[type="checkbox"][value$="Goal"]').first()).toBeVisible()
})

for (const [path, endpoint, data, content] of [
  ['load', 'load', load, '2.00 GB'],
  ['partitionload', 'partition_load', partitionLoad, 'orders'],
  ['proposals', 'proposals', proposals, 'Proposal Changes']
]) {
  test(`async ${path} refresh reuses the task ID and renders the completed response`, async ({ page }) => {
    let requests = 0
    await page.route(`**/kafkacruisecontrol/${endpoint}?*`, async route => {
      requests++
      if (requests === 1) {
        return route.fulfill({ json: progress, headers: { 'User-Task-ID': 'async-task' } })
      }
      expect(route.request().headers()['user-task-id']).toBe('async-task')
      return route.fulfill({ json: data, headers: { 'User-Task-ID': 'async-task' } })
    })
    await page.goto(`./#/east/alpha/${path}`)
    if (path === 'partitionload') await page.getByRole('button', { name: 'Show Partition Load' }).click()
    await expect(page.locator('#page')).toContainText('Collecting metrics')
    await expect(page.locator('#page')).toContainText('async-task')
    await page.getByRole('button', { name: /Refresh View Now/ }).click()
    await expect(page.locator('#page')).toContainText(content)
  })
}

async function stableImage (canvas) {
  let previous
  let unchanged = 0
  await expect.poll(async () => {
    const image = await canvas.evaluate(canvas => canvas.toDataURL())
    unchanged = image === previous ? unchanged + 1 : 0
    previous = image
    return unchanged
  }).toBeGreaterThanOrEqual(2)
  return previous
}

test('real bar charts update resources, filter topics and resize for stacked mode', async ({ page }) => {
  await page.goto('./#/east/alpha/resource_distributions')
  const topics = page.locator('.col-4 > .card canvas')
  await expect(topics).toHaveCount(2)
  await expect(topics.first()).toBeVisible()
  const initial = await stableImage(topics.first())
  expect(await topics.first().evaluate(canvas => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    return pixels.some((value, index) => index % 4 === 3 && value > 0)
  })).toBe(true)
  await page.getByRole('button', { name: 'display: leaders' }).click()
  await page.getByText('CPU', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'display: cpu' })).toBeVisible()
  expect(await stableImage(topics.first())).not.toBe(initial)
  await page.getByPlaceholder('filter topics..').fill('events')
  await expect(topics.first()).toBeHidden()
  await expect(topics.nth(1)).toBeVisible()
  await page.getByLabel('Stacked view').check()
  await expect(page.getByPlaceholder('filter topics..')).toBeDisabled()
  const stacked = page.locator('.col-8 .card-inner canvas')
  await expect(stacked).toBeVisible()
  expect((await stableImage(stacked)).length).toBeGreaterThan(1000)
  await page.getByRole('link', { name: 'Kafka Cluster State', exact: true }).click()
  await expect(page.locator('canvas')).toHaveCount(0)
})
