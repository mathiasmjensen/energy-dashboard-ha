import { expect, test } from '@playwright/test'

test.describe('energy dashboard', () => {
  const expectFixedMobileNav = async (page: import('@playwright/test').Page) => {
    const metrics = await page.locator('.mobile-bottom-nav').evaluate((element) => {
      const rect = element.getBoundingClientRect()

      return {
        bottom: rect.bottom,
        position: window.getComputedStyle(element).position,
        top: rect.top,
        viewportHeight: window.innerHeight,
      }
    })

    expect(metrics.position).toBe('fixed')
    expect(metrics.top).toBeGreaterThanOrEqual(0)
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight)
  }

  const expectPageCanScroll = async (page: import('@playwright/test').Page) => {
    const metrics = await page.evaluate(() => ({
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
    }))

    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)
  }

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

  test('lets desktop energy distribution and solar production step back to previous days together', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')

    const distributionPanel = page.locator('.distribution-panel')
    const productionPanel = page.locator('.solar-production-panel')

    await expect(distributionPanel).toContainText('Today')
    await expect(productionPanel).toContainText('Today')

    await distributionPanel.getByRole('button', { name: 'Show previous energy day' }).click()

    await expect(distributionPanel).not.toContainText('Today')
    await expect(productionPanel).not.toContainText('Today')
  })

  test('opens and closes the EV charger popup on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.clock.install({ time: new Date('2026-06-18T19:37:00+02:00') })
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
    await expect(dialog.getByLabel('Energy price day')).toContainText('Next 24 hours')
    await expect(dialog.locator('.ev-price-bar')).toHaveCount(24)
    await expect(dialog.locator('.ev-price-bar').first()).toHaveAttribute('title', /20:00/)
    await dialog.getByRole('button', { name: /Select .*21:00 energy price/i }).click()
    await expect(dialog.getByLabel('Plan charge from')).toHaveValue('21:00')
    await expect(dialog.getByLabel('Plan charge to')).toHaveValue('22:00')
    await dialog.getByRole('button', { name: /Select .*20:00 energy price/i }).click()
    await expect(dialog.getByLabel('Plan charge from')).toHaveValue('20:00')
    await expect(dialog.getByLabel('Plan charge to')).toHaveValue('21:00')
    await dialog.getByRole('button', { name: /Select .*23:00 energy price/i }).click()
    await expect(dialog.getByLabel('Plan charge from')).toHaveValue('23:00')
    await expect(dialog.getByLabel('Plan charge to')).toHaveValue('00:00')
    await dialog.getByRole('button', { name: /Select .*03:00 energy price/i }).click()
    await expect(dialog.getByLabel('Plan charge from')).toHaveValue('23:00')
    await expect(dialog.getByLabel('Plan charge to')).toHaveValue('03:00')
    await dialog.getByRole('button', { name: 'Save plan' }).click()
    await expect(dialog.getByText('Add script.evcc_set_charge_plan in Home Assistant')).toBeVisible()
    await dialog.getByRole('tab', { name: 'History' }).click()
    await expect(dialog.getByText('Latest charge sessions reconstructed from Home Assistant history.')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('opens the desktop battery modal and renders optimizer sections', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Open battery details', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Battery status' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Battery optimizer status' })).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Decision summary' })).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Optimizer controls' })).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Optimization plan' })).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'DK1 price curve' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Apply optimized plan' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Refresh prices / forecast' })).toBeVisible()
    await expect(dialog.getByText(/live optimizer unavailable|optimizer ready/i)).toBeVisible()
  })

  test('uses the same rolling price feed for desktop and mobile EV planning', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-06-18T19:37:00+02:00') })

    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Open EV charger details', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'EV Charger' })
    await expect(dialog.getByLabel('Energy price day')).toContainText('Next 24 hours')
    await expect(dialog.locator('.ev-price-bar')).toHaveCount(24)
    const desktopFirstPriceTitle = await dialog.locator('.ev-price-bar').first().getAttribute('title')
    expect(desktopFirstPriceTitle).toContain('20:00')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.getByRole('button', { name: 'EV', exact: true }).click()
    await page.getByRole('tab', { name: 'Plan' }).click()

    await expect(page.getByLabel('Energy price day')).toContainText('Next 24 hours')
    await expect(page.locator('.ev-price-bar')).toHaveCount(24)
    await expect(page.locator('.ev-price-bar').first()).toHaveAttribute('title', desktopFirstPriceTitle ?? '')
  })

  test('renders the mobile home tab with four-tab navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await expect(page.locator('.mobile-dashboard')).toBeVisible()
    await expect(page.locator('.mobile-status-bar')).toHaveCount(0)
    await expect(page.locator('.mobile-top-bar')).toHaveCount(0)
    await expect(page.locator('.mobile-home-hero-card img')).toBeVisible()
    await expect(page.locator('.mobile-bottom-nav__item')).toHaveCount(4)
    await expect(page.locator('.mobile-bottom-nav')).not.toContainText('More')
    await expectFixedMobileNav(page)
    await expect(page.locator('.mobile-home-metric')).toHaveCount(5)
    await expect(page.getByRole('heading', { name: 'Solar forecast' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy prices' })).toBeVisible()
  })

  test('renders the mobile solar, battery, and EV tabs as independent scrollable screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Solar' }).click()
    await expect(page.getByTestId('mobile-tab-solar')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Day' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy flow' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar production' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar forecast' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy prices' })).toBeVisible()
    const mobileDayLabels = page.getByTestId('mobile-tab-solar').locator('.mobile-insight-controls--day .mobile-card-action--static')
    await expect(mobileDayLabels).toHaveCount(2)
    await expect(mobileDayLabels.first()).toHaveText('Today')
    await expect(mobileDayLabels.nth(1)).toHaveText('Today')
    await page.getByTestId('mobile-tab-solar').getByRole('button', { name: 'Show previous energy day' }).first().click()
    await expect(mobileDayLabels.first()).not.toHaveText('Today')
    await expect(mobileDayLabels.nth(1)).not.toHaveText('Today')
    await expectPageCanScroll(page)
    await page.mouse.wheel(0, 3000)
    await expectFixedMobileNav(page)

    await page.getByRole('button', { name: 'Battery' }).click()
    await expect(page.getByTestId('mobile-tab-battery')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Battery history' })).toBeVisible()
    await expect(page.locator('.mobile-battery-hero-card')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Battery optimizer status' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Decision summary' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Optimizer controls' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Optimization plan' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'DK1 price curve' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Apply optimized plan' })).toBeVisible()
    await expectPageCanScroll(page)
    await page.mouse.wheel(0, 3000)
    await expectFixedMobileNav(page)

    await page.getByRole('button', { name: 'EV' }).click()
    await expect(page.getByTestId('mobile-tab-ev')).toBeVisible()
    await expect(page.locator('.mobile-vehicle-card')).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Status' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: 'Plan' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible()
    await expect(page.locator('.mobile-dashboard [role="dialog"]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Charger status' })).toBeVisible()
    await expect(page.getByText('Charger settings')).toBeVisible()
    await expect(page.getByLabel('Plan charge from')).toHaveCount(0)
    await expectFixedMobileNav(page)

    await page.getByRole('tab', { name: 'Plan' }).click()
    await expect(page.getByRole('tab', { name: 'Plan' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Plan charge')).toBeVisible()
    await expect(page.getByText('Active plan')).toBeVisible()
    await expect(page.getByLabel('Active charge plan enabled')).toBeVisible()
    await expect(page.getByLabel('Plan charge from')).toBeVisible()
    await expect(page.locator('.ev-price-bar')).toHaveCount(24)
    await expectPageCanScroll(page)
    await page.mouse.wheel(0, 3000)
    await expectFixedMobileNav(page)

    await page.getByRole('tab', { name: 'History' }).click()
    await expect(page.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('Latest charge sessions reconstructed from Home Assistant history.')).toBeVisible()
    await expectPageCanScroll(page)
    await page.mouse.wheel(0, 3000)
    await expectFixedMobileNav(page)
  })
})
