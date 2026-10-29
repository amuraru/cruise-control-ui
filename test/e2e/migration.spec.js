import { expect, test } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { fulfillCruiseControl, load, mockCruiseControl, partitionLoad, progress, proposals, taskId } from '../fixtures/cruise-control'

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
  ['/east/alpha/user_tasks', taskId],
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

test('administration dropdown supports keyboard navigation and Escape', async ({ page }) => {
  await page.goto('./#/')
  const toggle = page.getByRole('button', { name: 'UI Administration', exact: true })
  await toggle.focus()
  await toggle.press('ArrowDown')
  const preferences = page.getByRole('link', { name: /Preferences/ })
  await expect(preferences).toBeFocused()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await preferences.press('Escape')
  await expect(preferences).toBeHidden()
  await expect(toggle).toBeFocused()
  await toggle.press('Enter')
  await preferences.click()
  await expect(page).toHaveURL(/#\/preferences$/)
  await expect(page.locator('#page')).toContainText('Cruise Control UI - Preferences')
})

async function primaryColor (page) {
  return page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim())
}

test('theme picker offers all installed themes, switches live, and remembers the selection', async ({ page }) => {
  await page.goto('./#/preferences')
  const picker = page.getByLabel('Theme', { exact: true })
  await expect(picker).toHaveValue('sandstone')
  await expect.poll(() => primaryColor(page)).toBe('#325d88')
  const installed = readdirSync('node_modules/bootswatch/dist', { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  expect(await picker.locator('option').evaluateAll(options => options.map(option => option.value).sort())).toEqual(installed)
  for (const [theme, color] of [['cosmo', '#2780e3'], ['darkly', '#375a7f'], ['sandstone', '#325d88']]) {
    await picker.selectOption(theme)
    await expect.poll(() => primaryColor(page)).toBe(color)
    await expect(page.locator('head link[data-bootswatch-theme]')).toHaveCount(1)
  }
  await picker.selectOption('cosmo')
  await expect.poll(() => primaryColor(page)).toBe('#2780e3')
  await page.reload()
  await expect(picker).toHaveValue('cosmo')
  await expect.poll(() => primaryColor(page)).toBe('#2780e3')
  await page.getByRole('link', { name: 'Summary', exact: true }).click()
  await expect.poll(() => primaryColor(page)).toBe('#2780e3')
})

test('an invalid saved theme falls back to Sandstone', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cruise-control-ui.theme', 'https://example.test/untrusted.css'))
  await page.goto('./#/preferences')
  await expect(page.getByLabel('Theme', { exact: true })).toHaveValue('sandstone')
  await expect.poll(() => primaryColor(page)).toBe('#325d88')
})

test('unavailable browser storage does not prevent theme switching', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get () { throw new DOMException('Storage is disabled', 'SecurityError') }
    })
  })
  await page.goto('./#/preferences')
  const picker = page.getByLabel('Theme', { exact: true })
  await expect(picker).toHaveValue('sandstone')
  await picker.selectOption('cosmo')
  await expect.poll(() => primaryColor(page)).toBe('#2780e3')
  await page.reload()
  await expect(picker).toHaveValue('sandstone')
  await expect.poll(() => primaryColor(page)).toBe('#325d88')
})

test('a storage write failure does not interrupt the selected theme', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage is full', 'QuotaExceededError')
    }
  })
  await page.goto('./#/preferences')
  await page.getByLabel('Theme', { exact: true }).selectOption('darkly')
  await expect.poll(() => primaryColor(page)).toBe('#375a7f')
})

test('partition filters align on desktop and stack on narrow screens', async ({ page }) => {
  await page.goto('./#/east/alpha/partitionload')
  const resource = page.locator('#page select')
  const entries = page.locator('#page input[type="number"]').first()
  await expect(resource).toBeVisible()
  await expect(entries).toBeVisible()
  let resourceBox = await resource.boundingBox()
  let entriesBox = await entries.boundingBox()
  expect(Math.abs(resourceBox.y - entriesBox.y)).toBeLessThan(2)
  expect(entriesBox.x).toBeGreaterThan(resourceBox.x + resourceBox.width)
  await page.setViewportSize({ width: 600, height: 900 })
  resourceBox = await resource.boundingBox()
  entriesBox = await entries.boundingBox()
  expect(entriesBox.y).toBeGreaterThan(resourceBox.y + resourceBox.height)
  expect(Math.abs(resourceBox.x - entriesBox.x)).toBeLessThan(2)
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
        return fulfillCruiseControl(route, progress, { status: 202, taskId })
      }
      expect(route.request().headers()['user-task-id']).toBe(taskId)
      return fulfillCruiseControl(route, data, { taskId })
    })
    await page.goto(`./#/east/alpha/${path}`)
    if (path === 'partitionload') await page.getByRole('button', { name: 'Show Partition Load' }).click()
    await expect(page.locator('#page')).toContainText('Collecting metrics')
    await expect(page.locator('#page')).toContainText(taskId)
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
