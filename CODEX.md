# CODEX.md

This file is a repo-specific handoff for future Codex passes.

## What this project is

`energy-dashboard-hakit` is a React + TypeScript + Vite dashboard for Home
Assistant using HAKit.

It has two major surfaces:

- desktop dashboard
- mobile dashboard

Both surfaces share the same Home Assistant / EVCC / price / Fox Cloud data
hooks where possible.

## Current styling direction

The project is being migrated from a very large custom stylesheet to
Tailwind-first React components.

### Already moved toward Tailwind

- `src/index.css`
- `src/components/dashboard/desktop/DesktopShared.tsx`
- `src/components/dashboard/desktop/DesktopFlow.tsx`
- `src/components/dashboard/desktop/DesktopDashboard.tsx`
- `src/components/dashboard/desktop/DesktopPanels.tsx`
- `src/components/mobile/MobilePrimitives.tsx`
- `src/components/mobile/MobileHomeScreen.tsx`
- `src/components/mobile/MobileSolarScreen.tsx`
- `src/components/mobile/MobileEvScreen.tsx`
- `src/components/mobile/MobileDashboard.tsx`
- `src/components/ev/EvChargerContent.tsx`
- `src/components/battery/BatteryOptimizerSections.tsx`
- `src/components/BatteryStatusModal.tsx`
- `src/components/shared/BatteryVisual.tsx`
- parts of `src/components/mobile/MobileBatteryScreen.tsx`

### Still CSS-heavy

- `src/components/EnergyDashboard.css`
- desktop/mobile flow pulse animation rules
- reduced-motion handling for the flow paths

When changing UI, prefer:

1. Tailwind utilities in the component
2. shared utility helpers via `cn(...)`
3. shared classes from `src/index.css`
4. only then add CSS to `EnergyDashboard.css`

## Design constraints

- Do not casually redesign the app while refactoring.
- Preserve the current dark premium look unless the user explicitly asks for a
  visual change.
- Mobile and desktop are both important and must keep parity in data behavior.
- Charts should keep matching styles across home, solar, battery, and EV.

## Important data flow

- HAKit / Home Assistant entity data stays in hooks and data resolvers.
- EV charger logic lives around:
  - `src/hooks/useEvChargerController.ts`
  - `src/components/ev/EvChargerContent.tsx`
- Battery optimizer logic lives around:
  - `src/hooks/useBatteryOptimizer.ts`
  - `src/services/batteryOptimizer.ts`
  - `src/services/batteryOptimizerClient.ts`
  - `src/models/batteryOptimizer.ts`
- Historical day switching lives in:
  - `src/hooks/useHistoricalEnergyDay.ts`

## Shared type layout

Shared types are being centralized under `src/models`.

Examples:

- `src/models/batteryOptimizer.ts`
- `src/models/dashboardInsights.ts`
- `src/models/evChargePlan.ts`
- `src/models/peakRates.ts`
- `src/models/solarForecast.ts`

When adding new cross-file types:

1. put shared/domain shapes in `src/models`
2. import them into hooks/services/components
3. keep only tiny component-local prop helpers inline

## Recent high-value fixes

- Historical energy distribution now fetches per-entity history so day switching
  is more reliable.
- Distribution supports battery charge/discharge and grid import/export splits.
- Missing battery optimizer backend now falls back to mock mode instead of
  repeatedly spamming 404 failures.
- Interactive battery flow node styling was fixed so it keeps the same visual
  box treatment as the other nodes.

## Build notes

- Vite 8 requires Node `20.19+` or `22.12+`.
- If build fails in Codex but works in the user shell, check `node -v` and
  `which node`.

## Good next refactor targets

1. Reduce `EnergyDashboard.css` further by isolating only:
   - SVG flow animations
   - reduced-motion fallbacks
2. If desired, move the remaining flow animation classes into Tailwind config
   keyframes/utilities, but only if that stays readable
3. Extract repeated card shells / headers into even smaller presentational
  components
4. Continue moving leftover exported view-only types out of component folders if
   they become shared across screens

## Validation checklist

Before closing a meaningful UI pass:

```bash
npm run typecheck
npm run lint
npm run build:ha
npm run test:e2e
```

If build cannot run because Codex is on the wrong Node version, say that
clearly in the final response.
