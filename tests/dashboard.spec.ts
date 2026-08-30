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
    const topNavigation = page.getByRole('navigation', { name: 'Dashboard sections' })
    await expect(topNavigation).toBeVisible()
    await expect(topNavigation.getByRole('button')).toHaveCount(5)
    await expect(topNavigation.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('.overview-panel')).toHaveCount(6)
    await expect(page.locator('.overview-flow-path')).toHaveCount(5)
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy distribution' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar production' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Battery status' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy market' })).toBeVisible()
    await expect(page.locator('.market-rates-panel')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Solar forecast' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Energy prices' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open EV charger details', exact: true })).toBeVisible()
    await expect(page.locator('body')).not.toContainText('CO2 Saved')
    await expect(page.locator('body')).not.toContainText('unknown')
    await expect(page.locator('body')).not.toContainText('unavailable')
  })

  test('keeps the full dashboard workspace on iPad-sized screens', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/')

    await expect(page.locator('[aria-label="Home energy overview"]')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Dashboard sections' })).toBeVisible()
    await expect(page.locator('.mobile-dashboard')).toHaveCount(0)
  })

  test('keeps desktop destinations on the same canvas and header rhythm', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')

    for (const title of ['Overview', 'Battery', 'EV Charger', 'Notifications', 'Settings'] as const) {
      await page.getByRole('button', { name: title, exact: true }).click()
      const navigation = page.getByRole('navigation', { name: 'Dashboard sections' })

      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
      await expect(navigation).toBeVisible()
      expect((await navigation.boundingBox())?.y).toBe(24)
      await expect(navigation.getByRole('button', { name: title, exact: true })).toHaveAttribute('aria-current', 'page')
    }
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

  test('opens the EV charger as a URL-backed desktop workspace', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.clock.install({ time: new Date('2026-06-18T19:37:00+02:00') })
    await page.goto('/')

    await page.getByRole('button', { name: 'Open EV charger details', exact: true }).click()

    const workspace = page.locator('section[aria-label="EV charger workspace"]')
    await expect(page).toHaveURL(/#\/ev-charger$/)
    await expect(workspace).toBeVisible()
    await expect(workspace.getByAltText(/wall mounted ev charger/i)).toBeVisible()
    await expect(workspace.getByText('Charger settings')).toBeVisible()
    await expect(workspace.getByLabel('Charge mode')).toBeVisible()
    await expect(workspace.getByLabel('Charge mode')).toHaveValue('pv')
    await expect(workspace.getByRole('checkbox', { name: 'Charge plan enabled' })).toBeVisible()
    await expect(workspace.getByText('Plan charge')).toBeVisible()
    await expect(workspace.getByRole('tab', { name: 'Plan' })).toHaveAttribute('aria-selected', 'true')
    await expect(workspace.getByRole('tab', { name: 'History' })).toBeVisible()
    await expect(workspace.getByLabel('Plan charge from')).toHaveValue('22:00')
    await expect(workspace.getByLabel('Plan charge to')).toHaveValue('06:00')
    await expect(workspace.getByLabel('Energy prices by hour')).toBeVisible()
    await expect(workspace.getByLabel('Energy price day')).toContainText('Next 24 hours')
    const desktopPriceBars = workspace.getByLabel('Energy prices by hour').getByRole('button')
    await expect(desktopPriceBars).toHaveCount(24)
    await expect(desktopPriceBars.first()).toHaveAttribute('title', /Now.*19:00/)
    await desktopPriceBars.first().click()
    await expect(workspace.getByLabel('Plan charge from')).toHaveValue('19:38')
    await expect(workspace.getByLabel('Plan charge to')).toHaveValue('20:00')
    await desktopPriceBars.first().click()
    await workspace.getByRole('button', { name: /Select .*21:00 energy price/i }).click()
    await expect(workspace.getByLabel('Plan charge from')).toHaveValue('21:00')
    await expect(workspace.getByLabel('Plan charge to')).toHaveValue('22:00')
    await workspace.getByRole('button', { name: /Select .*20:00 energy price/i }).click()
    await expect(workspace.getByLabel('Plan charge from')).toHaveValue('20:00')
    await expect(workspace.getByLabel('Plan charge to')).toHaveValue('21:00')
    await workspace.getByRole('button', { name: /Select .*23:00 energy price/i }).click()
    await expect(workspace.getByLabel('Plan charge from')).toHaveValue('23:00')
    await expect(workspace.getByLabel('Plan charge to')).toHaveValue('00:00')
    await workspace.getByRole('button', { name: /Select .*03:00 energy price/i }).click()
    await expect(workspace.getByLabel('Plan charge from')).toHaveValue('23:00')
    await expect(workspace.getByLabel('Plan charge to')).toHaveValue('03:00')
    await workspace.getByRole('button', { name: 'Save plan' }).click()
    await expect(workspace.getByText('Add script.evcc_set_charge_plan in Home Assistant')).toBeVisible()
    await workspace.getByRole('tab', { name: 'History' }).click()
    await expect(workspace.getByText('Latest charge sessions reconstructed from Home Assistant history.')).toBeVisible()

    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
  })

  test('opens the desktop battery workspace and keeps optimizer content scrollable', async ({ page }) => {
    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Open battery details', exact: true }).click()

    const workspace = page.locator('section[aria-label="Battery details"]')
    await expect(workspace).toBeVisible()
    await expect(workspace).toHaveClass(/overflow-hidden/)
    await expect(workspace.getByRole('heading', { name: 'Battery flow' })).toBeVisible()
    await expect(workspace.getByRole('heading', { name: 'Optimization schedule' })).toBeVisible()
    await expect(workspace.getByRole('heading', { name: 'Optimization actions' })).toBeVisible()
    await expect(workspace.getByRole('heading', { name: 'Price optimization' })).toBeVisible()
    await workspace.getByRole('button', { name: 'View full optimization' }).click()
    await expect(workspace).toHaveClass(/overflow-y-auto/)
    await workspace.getByRole('tab', { name: 'Full plan' }).click()
    await expect(workspace.getByRole('heading', { name: 'Optimization plan' })).toBeVisible()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Optimizer controls' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Apply optimized plan' })).toBeVisible()
  })

  test('uses the same rolling price feed for desktop and mobile EV planning', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-06-18T19:37:00+02:00') })

    await page.setViewportSize({ width: 1672, height: 941 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Open EV charger details', exact: true }).click()

    const workspace = page.locator('section[aria-label="EV charger workspace"]')
    await expect(workspace.getByLabel('Energy price day')).toContainText('Next 24 hours')
    const desktopPriceBars = workspace.getByLabel('Energy prices by hour').getByRole('button')
    await expect(desktopPriceBars).toHaveCount(24)
    const desktopFirstPriceTitle = await desktopPriceBars.first().getAttribute('title')
    expect(desktopFirstPriceTitle).toContain('Now')
    expect(desktopFirstPriceTitle).toContain('19:00')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.getByRole('button', { name: 'EV', exact: true }).click()
    await page.getByRole('tab', { name: 'Plan' }).click()

    await expect(page.getByLabel('Energy price day')).toContainText('Next 24 hours')
    await expect(page.getByLabel('Energy prices by hour')).toBeVisible()
    await expect(page.getByLabel('Energy prices by hour').getByRole('button').first()).toHaveAttribute('title', desktopFirstPriceTitle ?? '')
  })

  test('renders the mobile home tab with dashboard navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await expect(page.getByTestId('mobile-dashboard')).toBeVisible()
    await expect(page.locator('.mobile-status-bar')).toHaveCount(0)
    await expect(page.locator('.mobile-top-bar')).toHaveCount(0)
    await expect(page.getByAltText('Luxury home with solar roof, battery, EV charger, and Tesla')).toBeVisible()
    await expect(page.locator('.mobile-bottom-nav__item')).toHaveCount(5)
    await expect(page.locator('.mobile-bottom-nav')).not.toContainText('More')
    await expect(page.getByRole('button', { name: 'Alerts' })).toBeVisible()
    await expectFixedMobileNav(page)
    await expect(page.getByText('Solar output')).toBeVisible()
    await expect(page.getByText('Grid flow')).toBeVisible()
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
    await page.getByTestId('mobile-tab-solar').getByRole('button', { name: 'Show previous energy day' }).first().click()
    await expectPageCanScroll(page)
    await page.mouse.wheel(0, 3000)
    await expectFixedMobileNav(page)

    await page.getByRole('button', { name: 'Battery' }).click()
    await expect(page.getByTestId('mobile-tab-battery')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Battery optimizer status' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Decision summary' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'DK1 price curve' })).toBeVisible()
    await page.getByRole('button', { name: 'Details' }).click()
    await page.getByRole('tab', { name: 'Controls' }).click()
    await expect(page.getByRole('heading', { name: 'Optimizer controls' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Apply optimized plan' })).toBeVisible()
    await page.getByRole('tab', { name: 'Plan', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Optimization plan' })).toBeVisible()
    await page.getByRole('tab', { name: 'Battery' }).click()
    await expect(page.getByRole('heading', { name: 'Battery history' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Battery status' })).toBeVisible()
    await expectPageCanScroll(page)
    await page.mouse.wheel(0, 3000)
    await expectFixedMobileNav(page)

    await page.getByRole('button', { name: 'EV' }).click()
    await expect(page.getByTestId('mobile-tab-ev')).toBeVisible()
    await expect(page.getByAltText('Tesla Model Y')).toBeVisible()
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
    await expect(page.getByRole('checkbox', { name: 'Active charge plan enabled' })).toBeVisible()
    await expect(page.getByLabel('Plan charge from')).toBeVisible()
    await expect(page.getByLabel('Energy prices by hour')).toBeVisible()
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
