import { expect, test } from '@playwright/test'
import {
  formatChartValue,
  getBarChartGeometry,
  getDesktopLineChartGeometry,
  getMobileLineChartGeometry,
} from '../src/services/chartGeometry'

test.describe('chart geometry service', () => {
  test('keeps flat zero bar charts visible', () => {
    const geometry = getBarChartGeometry([0, 0, 0])

    expect(geometry.isFlat).toBe(true)
    expect(geometry.zeroY).toBe(50)
    expect(geometry.bars).toHaveLength(3)
    expect(geometry.bars.every((bar) => bar.height > 0)).toBe(true)
  })

  test('marks negative bars without hiding positive values', () => {
    const geometry = getBarChartGeometry([-1, 0, 2])

    expect(geometry.isFlat).toBe(false)
    expect(geometry.bars[0].isNegative).toBe(true)
    expect(geometry.bars[2].isNegative).toBe(false)
    expect(geometry.bars.every((bar) => bar.height > 0)).toBe(true)
  })

  test('creates mobile and desktop line geometry with visible first and last points', () => {
    const mobile = getMobileLineChartGeometry([0, 2, -1, 3])
    const desktop = getDesktopLineChartGeometry([0, 2, -1, 3])

    expect(mobile.linePath).toContain('M 12')
    expect(mobile.dots.at(-1)?.x).toBe(308)
    expect(desktop.line.startsWith('0,')).toBe(true)
    expect(desktop.line).toContain('310,')
  })

  test('formats chart values consistently across dashboard surfaces', () => {
    expect(formatChartValue(1.234, 'DKK/kWh')).toBe('1.23 DKK/kWh')
    expect(formatChartValue(76.4, '%')).toBe('76 %')
  })
})
