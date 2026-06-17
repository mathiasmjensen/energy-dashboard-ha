# Task: Pulse Energy Flow Lines

## Goal

Animate the energy-flow lines between solar, home, battery, grid, and EV charger so each path pulses in the correct energy direction.

## Scope

- Update `src/components/EnergyFlowOverlay.tsx` and related CSS.
- Keep the existing 1536x864 canvas alignment.
- Keep cyan for solar/home flow, green for battery/EV flow, and yellow for grid flow.
- Prefer SVG stroke animations using `stroke-dasharray`, `stroke-dashoffset`, markers, gradients, or small moving particles.
- Respect `prefers-reduced-motion` by disabling or simplifying movement.

## Flow Directions

- Solar production should pulse from the roof solar badge toward:
  - home consumption
  - battery
  - EV charger path when solar is contributing
- Battery should pulse:
  - down/up according to charge or discharge status if available
  - toward home/EV when discharging
  - toward battery when charging
- Grid should pulse:
  - grid tower to home/battery when importing
  - grid badge into the home badge when importing
  - home/solar/battery toward grid tower when exporting
- EV charger should pulse toward the vehicle when charger power is positive and reverse back toward the charger/home path when charger power is negative.

## Data Behavior

- Use Home Assistant/HAKit entity state when possible:
  - `gridStatus` or signed `gridPower` for import/export direction
  - `batteryStatus` or signed `batteryPower` for charge/discharge direction
  - signed `batteryPower`: positive discharging toward home/EV paths, negative charging toward the battery
  - signed `gridPower`: positive importing from grid, negative exporting back to the grid
  - signed `evChargePower` for charger-to-vehicle direction: positive toward the vehicle, negative back toward the charger/home path
- Missing, `unknown`, or `unavailable` values should fall back to a subtle idle pulse rather than breaking the overlay.

## Acceptance Criteria

- Direction is visually obvious at 1536x864 and 1920x1080.
- Arrowheads and moving pulses agree with each other.
- Pulses do not obscure badges, panel text, or the charger popup.
- Animation remains smooth in Chromium.
- `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e` pass.
- Add or update Playwright coverage to verify the SVG flow overlay still renders and the app has no framework overlay.

## Notes

The current overlay is static SVG paths in `EnergyFlowOverlay`. A clean implementation will likely add path-specific classes/data attributes and compute a small direction model from the existing `useEnergyData()` output.
