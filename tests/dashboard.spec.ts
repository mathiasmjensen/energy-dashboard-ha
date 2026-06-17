import { expect, test } from '@playwright/test'

test.describe('energy dashboard', () => {
  test('renders the redesigned overview with placeholder-safe metrics on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')

    await expect(page.getByAltText(/night house with solar panels/i)).toBeVisible()
    await expect(page.locator('.overview-sidebar')).toBeVisible()
    await expect(page.locator('.nav-item')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible()
    await expect(page.locator('.overview-panel')).toHaveCount(7)
    await expect(page.locator('.overview-flow-path')).toHaveCount(4)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy distribution' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar production' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Battery status' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Vehicle' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar forecast' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy prices' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open EV charger details', exact: true })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('CO2 Saved')
    await expect(page.locator('body')).not.toContainText('unknown')
    await expect(page.locator('body')).not.toContainText('unavailable')
  })

  test('opens and closes the EV charger popup on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Open EV charger details', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'EV Charger' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByAltText(/wall mounted ev charger/i)).toBeVisible()
    await expect(dialog.getByText('Charger settings')).toBeVisible()
    await expect(dialog.getByLabel('Charge mode')).toBeVisible()
    await expect(dialog.getByLabel('Charge mode')).toHaveValue('pv')
    await expect(dialog.getByLabel('Charge plan enabled')).toBeVisible()
    await expect(dialog.getByText('Plan charge')).toBeVisible()
    await expect(dialog.getByRole('tab', { name: 'Plan' })).toHaveAttribute('aria-selected', 'true')
    await expect(dialog.getByRole('tab', { name: 'History' })).toBeVisible()
    await expect(dialog.getByLabel('Plan charge from')).toHaveValue('22:00')
    await expect(dialog.getByLabel('Plan charge to')).toHaveValue('06:00')
    await expect(dialog.getByLabel('Energy prices by hour')).toBeVisible()
    await expect(dialog.getByLabel('Energy price day')).toContainText('Today')
    await expect(dialog.locator('.ev-price-bar')).toHaveCount(24)
    await dialog.getByRole('button', { name: /Select 02:00 energy price/i }).click()
    await expect(dialog.getByLabel('Plan charge from')).toHaveValue('02:00')
    await expect(dialog.getByLabel('Plan charge to')).toHaveValue('03:00')
    await dialog.getByRole('button', { name: /Select 05:00 energy price/i }).click()
    await expect(dialog.getByLabel('Plan charge from')).toHaveValue('02:00')
    await expect(dialog.getByLabel('Plan charge to')).toHaveValue('06:00')
    await dialog.getByRole('button', { name: 'Save plan' }).click()
    await expect(dialog.getByText('Add script.evcc_set_charge_plan in Home Assistant')).toBeVisible()
    await dialog.getByRole('tab', { name: 'History' }).click()
    await expect(dialog.getByText('Latest charge sessions reconstructed from Home Assistant history.')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('renders the mobile home tab with storyboard chrome and four-tab navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await expect(page.locator('.mobile-dashboard')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
    await expect(page.locator('.mobile-status-bar')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open notifications' })).toBeVisible()
    await expect(page.locator('.mobile-home-hero img')).toBeVisible()
    await expect(page.locator('.mobile-bottom-nav__item')).toHaveCount(4)
    await expect(page.locator('.mobile-bottom-nav')).not.toContainText('More')
    await expect(page.locator('.mobile-kpi-row')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar forecast' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy prices' })).toBeVisible()
  })

  test('renders the mobile solar, battery, and EV tabs as independent scrollable screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Solar' }).click()
    await expect(page.getByTestId('mobile-tab-solar')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Day' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy flow' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar production' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar forecast' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy prices' })).toBeVisible()

    let scrollMetrics = await page.locator('.mobile-tab-panel').evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }))
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight)

    await page.getByRole('button', { name: 'Battery' }).click()
    await expect(page.getByTestId('mobile-tab-battery')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Battery', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Battery history' })).toBeVisible()
    await expect(page.locator('.mobile-battery-hero-card')).toBeVisible()

    scrollMetrics = await page.locator('.mobile-tab-panel').evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }))
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight)

    await page.getByRole('button', { name: 'EV' }).click()
    await expect(page.getByTestId('mobile-tab-ev')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'EV Charger', exact: true })).toBeVisible()
    await expect(page.locator('.mobile-vehicle-card')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Plan' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible()
    await expect(page.locator('.mobile-dashboard [role="dialog"]')).toHaveCount(0)
    await expect(page.getByText('Charger settings')).toBeVisible()
    await expect(page.getByLabel('Plan charge from')).toBeVisible()
    await expect(page.locator('.ev-price-bar')).toHaveCount(24)

    await page.getByRole('tab', { name: 'History' }).click()
    await expect(page.getByText('Latest charge sessions reconstructed from Home Assistant history.')).toBeVisible()

    scrollMetrics = await page.locator('.mobile-tab-panel').evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }))
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight)
  })
})
