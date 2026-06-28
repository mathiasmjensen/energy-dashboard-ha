# Energy Dashboard HAKit

Standalone React + TypeScript + Vite dashboard for Home Assistant, built with
HAKit (`@hakit/core` and `@hakit/components`).

The dashboard uses `public/energy-dashboard/background.png` as the scene image
inside a 1536x864 design canvas, then overlays glass metric cards, central
power-flow callouts, SVG flow lines, a battery detail panel, and bottom
analytics cards.

The current Overview redesign uses the assets in
`public/new-energy-dashboard/` inside a 1672x941 dark-mode canvas with a left
sidebar, central energy-flow scene, right detail rail, and bottom analytics row.

The Battery surfaces now include a battery optimizer layer:
- mobile Battery tab: summary + history + optimizer stack
- desktop Battery modal: summary + history + optimizer workspace

The UI is currently being migrated away from a monolithic stylesheet toward
Tailwind utility classes and shared presentational primitives. The design should
stay visually the same during this refactor, but new work should prefer
Tailwind-first components over adding more one-off CSS rules.

## Setup

```bash
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0
```

Set `VITE_HA_URL` in `.env` to your Home Assistant URL. `VITE_HA_TOKEN` is
optional; leaving it blank lets HAKit use the normal Home Assistant login flow.

## Scripts

```bash
npm run typecheck
npm run lint
npm run build
npm run build:ha
npm run test:e2e
```

## Frontend Styling

Tailwind CSS is configured through:

- `tailwind.config.ts`
- `postcss.config.js`
- `src/index.css`

Shared primitives already moved to Tailwind live in:

- `src/components/dashboard/desktop/DesktopShared.tsx`
- `src/components/dashboard/desktop/DesktopFlow.tsx`
- `src/components/dashboard/desktop/DesktopDashboard.tsx`
- `src/components/dashboard/desktop/DesktopPanels.tsx`
- `src/components/mobile/MobilePrimitives.tsx`
- `src/components/mobile/MobileHomeScreen.tsx`
- `src/components/mobile/MobileSolarScreen.tsx`
- `src/components/mobile/MobileDashboard.tsx`
- `src/components/battery/BatteryOptimizerSections.tsx`
- `src/components/BatteryStatusModal.tsx`
- `src/components/ev/EvChargerContent.tsx`
- `src/components/mobile/MobileEvScreen.tsx`
- `src/components/shared/BatteryVisual.tsx`

The remaining `src/components/EnergyDashboard.css` file still contains layout
and specialty styles that have not been fully migrated yet. After the current
pass it is effectively limited to the desktop/mobile SVG flow pulse animation
rules and their reduced-motion fallback. The shared battery illustration has
been moved into a React component so it no longer depends on stylesheet
pseudo-elements.

### Styling rules for future changes

1. Prefer inline Tailwind utilities or shared helpers like `cn(...)`.
2. Reuse the shared glass surfaces (`dashboard-glass-panel`,
   `dashboard-glass-card`) from `src/index.css`.
3. Keep theme tokens in Tailwind config under `theme.extend.colors.dashboard`.
4. Only add new CSS to `EnergyDashboard.css` when the effect is hard to express
   with utilities alone, such as SVG animation paths or highly specific scene
   positioning.

## Node / Build Notes

This repo uses Vite 8 and should be built with **Node 20.19+** or **22.12+**.

If `npm run build` fails with a Vite engine error, check:

```bash
node -v
which node
```

In this automation shell, `typecheck` passed during the Tailwind migration, but full
`build` was blocked by the runtime resolving to Node 18 instead of the newer Node
installed in your environment.

## Project Structure

- `src/components/EnergyDashboard.tsx`
  Orchestrates desktop vs mobile rendering and wires shared view-model data.
- `src/components/dashboard/desktop/*`
  Desktop overview shell, panels, and flow scene.
- `src/components/mobile/*`
  Mobile screens, shell, and mobile-specific presentational blocks.
- `src/components/battery/*`
  Battery optimizer UI sections shared between mobile Battery and desktop modal.
- `src/components/ev/*`
  EV charger content shared between desktop modal and mobile EV screens.
- `src/hooks/*`
  Data orchestration for HA, EVCC, price feeds, historical views, and optimizer.
- `src/services/*`
  Formatting, adapters, API clients, and pure data normalization logic.

## Deploy To Home Assistant Docker

For Home Assistant running in Docker, find the host host path mounted into
the container as `/config`. The dashboard should be copied to that mount under
`www/energy-dashboard-hakit`, which Home Assistant serves at
`/local/energy-dashboard-hakit/`.

1. Optionally set your HA URL for the browser that will open the dashboard:

```bash
cp .env.example .env
```

Edit `.env` if you need to override the URL:

```bash
VITE_HA_URL=
VITE_HA_TOKEN=
```

When the dashboard is opened from Home Assistant at `/local/...`, the production
build defaults to the same browser origin. Set `VITE_HA_URL` only if you deploy
the dashboard somewhere else or need a specific HTTPS/reverse-proxy URL. Leave
`VITE_HA_TOKEN` empty unless you intentionally want to bake a long-lived token
into the static build.

2. Build for Home Assistant's `/local` path:

```bash
npm run build:ha
```

3. Copy the build output into the HA config mount. Replace the destination with
your host deployment path:

```bash
mkdir -p /path/to/homeassistant/config/www/energy-dashboard-hakit
rsync -a --delete dist/ /path/to/homeassistant/config/www/energy-dashboard-hakit/
```

4. Open the dashboard:

```text
http://YOUR_HA_HOST_OR_IP:8123/local/energy-dashboard-hakit/index.html
```

If you host the dashboard outside Home Assistant, set `VITE_HA_URL` to the HA
origin that the browser can reach before building.

## Entity Mapping

Entity placeholders live in `src/data/energyEntities.ts`. Replace those sensor
IDs with the real entities from your Home Assistant instance.

Weather is read from `weather.forecast_home` or `weather.home` by default for
the dashboard status chips. If your weather integration uses another entity ID,
update `weatherHome` in `src/data/energyEntities.ts`.

Unknown, unavailable, or missing values render as `---`.

## Home Assistant Package

A complete drop-in package is available at
`home-assistant/energy-dashboard-hakit.yaml`. Copy it to a valid Home Assistant
package slug path:

```text
/config/packages/energy_dashboard_hakit.yaml
```

Then ensure `configuration.yaml` has packages enabled:

```yaml
homeassistant:
  packages: !include_dir_named packages
```

The package creates the helper entities, endpoint-backed sensors, EVCC REST
commands, charge-plan script, and start/stop automations expected by the
dashboard.

It also creates normalized Fox Cloud day-total sensors for the energy
distribution cards by polling the official Fox Cloud API from Home Assistant:
`sensor.energy_dashboard_solar_production_today`,
`sensor.energy_dashboard_solar_production_feed`,
`sensor.energy_dashboard_home_consumption_today`,
`sensor.energy_dashboard_grid_import_today`,
`sensor.energy_dashboard_battery_charge_today`, and
`sensor.energy_dashboard_battery_discharge_today`.

Add these secrets in `/config/secrets.yaml` before reloading Home Assistant:

```yaml
foxess_api_key: your_fox_cloud_api_key
foxess_device_sn: your_fox_inverter_serial_number
foxess_api_domain: https://www.foxesscloud.com
```

`foxess_api_domain` is optional and defaults to `https://www.foxesscloud.com`.
A placeholder template is included at
`home-assistant/secrets.yaml`.

## Peak Rates

For phone/mobile-internet access, Home Assistant should fetch the price endpoint
and expose the result as an entity attribute. The dashboard reads
`sensor.energy_dashboard_peak_rates` first and only uses browser fetching if you
explicitly set `VITE_PEAK_RATE_URL`.

Recommended HA entity shape:

```yaml
sensor.energy_dashboard_peak_rates
  attributes:
    prices:
      - start: "2026-06-10T22:00:00.000Z"
        end: "2026-06-10T23:00:00.000Z"
        price: 1.2079
```

Example using HA `command_line` to wrap an array endpoint into a `prices`
attribute:

```yaml
command_line:
  - sensor:
      name: Energy Dashboard Peak Rates
      unique_id: energy_dashboard_peak_rates
      command: >-
        python3 -c "import json, urllib.request; data=json.load(urllib.request.urlopen('http://YOUR_SERVICE_HOST:1000/', timeout=10)); print(json.dumps({'count': len(data), 'prices': data}))"
      value_template: "{{ value_json.count }}"
      json_attributes:
        - prices
      scan_interval: 900
```

Optional browser fallback:

```bash
VITE_PEAK_RATE_URL=http://YOUR_SERVICE_HOST:1000/
```

The feed should return an array of hourly windows:

```json
[{ "start": "2026-06-10T22:00:00.000Z", "end": "2026-06-10T23:00:00.000Z", "price": 1.2079 }]
```

The dashboard shows the current active price and the highest upcoming price in
the next 24 hours. Keep `VITE_PEAK_RATE_URL=disabled` for normal HA-hosted
deployments so phones never try to fetch private LAN endpoints directly.

## Solar Forecast

For phone/mobile-internet access, Home Assistant should fetch EVCC's solar
forecast endpoint and expose it as `sensor.energy_dashboard_solar_forecast`.
The dashboard reads this entity first.

Example HA REST sensor:

```yaml
rest:
  - resource: http://YOUR_SERVICE_HOST:7070/api/tariff/solar
    scan_interval: 900
    sensor:
      - name: Energy Dashboard Solar Forecast
        unique_id: energy_dashboard_solar_forecast
        value_template: "{{ value_json.rates | count }}"
        json_attributes:
          - rates
```

Optional browser fallback:

```bash
VITE_EVCC_URL=http://YOUR_SERVICE_HOST:7070
VITE_EVCC_SOLAR_FORECAST_URL=http://YOUR_SERVICE_HOST:7070/api/tariff/solar
```

EVCC returns forecast power in 15-minute windows. The dashboard integrates each
window into kWh:

```text
window kWh = max(0, value) * window_hours / 1000
```

The value shown for today is the remaining EVCC forecast for the rest of the
day, matching EVCC's "remaining" semantics. The chart still shows a 24-hour
shape for the day. EVCC forecast data is cached in `localStorage` for 30 minutes
and stale cached data is reused if EVCC is temporarily unavailable.

Set this to skip EVCC and use the Open-Meteo fallback:

```bash
VITE_EVCC_SOLAR_FORECAST_URL=disabled
```

The Open-Meteo fallback uses `global_tilted_irradiance` and the configured panel
capacity:

```bash
VITE_SOLAR_FORECAST_LATITUDE=55.493
VITE_SOLAR_FORECAST_LONGITUDE=10.2046
VITE_SOLAR_FORECAST_TILT=30
VITE_SOLAR_FORECAST_AZIMUTH=0
VITE_SOLAR_PANEL_CAPACITY_KW=10
VITE_SOLAR_FORECAST_TIMEZONE=Europe/Copenhagen
```

## EVCC Charge History

For phone/mobile-internet access, Home Assistant should fetch EVCC charge
sessions and expose them as `sensor.energy_dashboard_evcc_charge_sessions`.
The dashboard reads this entity first and only uses browser-side EVCC fetching
if `VITE_EVCC_SESSIONS_URL` or `VITE_EVCC_URL` is explicitly configured.

Example HA `command_line` sensor wrapping EVCC's root array response:

```yaml
command_line:
  - sensor:
      name: Energy Dashboard EVCC Charge Sessions
      unique_id: energy_dashboard_evcc_charge_sessions
      command: >-
        python3 -c "import json, urllib.request; data=json.load(urllib.request.urlopen('http://YOUR_SERVICE_HOST:7070/api/sessions', timeout=10)); print(json.dumps({'count': len(data), 'sessions': data[:25]}))"
      value_template: "{{ value_json.count }}"
      json_attributes:
        - sessions
      scan_interval: 300
```

Optional browser fallback:

```bash
VITE_EVCC_SESSIONS_URL=http://YOUR_SERVICE_HOST:7070/api/sessions
```

## Battery Optimizer

The battery optimizer UI is intentionally separated from the existing live
entity mapping so we can swap the backend later without rewriting the screens.

### Frontend modes

```bash
VITE_BATTERY_OPTIMIZER_MODE=mock
VITE_BATTERY_OPTIMIZER_BASE_URL=
```

Supported modes:

- `ha-proxy` (default): calls same-origin Home Assistant hosted endpoints
- `mock`: renders deterministic optimizer data without any backend
- `direct-api`: calls `VITE_BATTERY_OPTIMIZER_BASE_URL` directly

For the new standalone Node backend in this repo, use:

```bash
VITE_BATTERY_OPTIMIZER_MODE=direct-api
VITE_BATTERY_OPTIMIZER_BASE_URL=http://YOUR_SERVER:8090
```

### Built-in backend service

This repo now includes a lightweight Node service:

```bash
npm run optimizer:start
```

It serves:

```text
GET  /api/battery/status
GET  /api/battery/plan
GET  /api/battery/settings
POST /api/battery/refresh
POST /api/battery/apply-plan
POST /api/battery/settings
POST /api/battery/pause
GET  /health
```

Example environment is included at:

```text
server/battery-optimizer.env.example
```

The service persists its state in:

```text
server-data/battery-optimizer-state.json
```

unless you override `BATTERY_OPTIMIZER_STATE_PATH`.

### Expected optimizer endpoints

The UI expects these routes:

```text
GET  /api/battery/status
GET  /api/battery/plan
GET  /api/battery/settings
POST /api/battery/refresh
POST /api/battery/apply-plan
POST /api/battery/settings
POST /api/battery/pause
```

Recommended HA setup is to expose those through a Home Assistant proxy or small
same-origin backend so phones do not need direct access to private LAN services.

If you do not proxy it through Home Assistant, point the frontend at the service
with `VITE_BATTERY_OPTIMIZER_MODE=direct-api`.

### Source-of-truth wiring

- FoxESS live battery SoC / battery power / grid now:
  existing Home Assistant entity mapping in `src/hooks/useEnergyData.ts`
- EVCC charger status / sessions / charge modes:
  existing EV controller and EVCC history pipeline
- DK1 optimizer economics:
  optimizer API payload first, existing peak-rate hook as fallback
- Solar surplus forecast:
  existing solar forecast hook first, optimizer payload can override
- EMHASS / FoxESS control:
  keep behind the optimizer backend or HA proxy, not in browser-side React

The new optimizer frontend files are:

- `src/services/batteryOptimizer.ts`
- `src/services/batteryOptimizerClient.ts`
- `src/services/batteryOptimizerFormatting.ts`
- `src/hooks/useBatteryOptimizer.ts`
- `src/components/battery/BatteryOptimizerSections.tsx`

## EVCC Controls

The EV charger popup is wired for EVCC semantics:

- Charge mode uses EVCC loadpoint modes: `off`, `pv`, `minpv`, and `now`.
- Max charging current is not edited from this dashboard; keep that in EVCC.
- Plan charge loads the current HA plan, lets you edit from/to times, turns the
  current plan on/off, and shows an interactive energy-price chart below the
  controls.
- Planned charging starts in EVCC Fast mode (`now`) and returns to Solar mode
  (`pv`) at the end of the window or when the plan is disabled.

Update these placeholders in `src/data/energyEntities.ts` to match your EVCC
entities:

```ts
evccLoadpointMode: 'select.evcc_loadpoint_mode'
evccChargePlanEnabled: 'input_boolean.evcc_charge_plan_enabled'
evccChargePlanStart: 'input_datetime.evcc_charge_start'
evccChargePlanEnd: 'input_datetime.evcc_charge_end'
evccSetChargePlanScript: 'script.evcc_set_charge_plan'
```

For plan-charge changes, the UI calls this HA script:

```ts
evccSetChargePlanScript: 'script.evcc_set_charge_plan'
```

The popup calls it through `script.turn_on` with this variable payload:

```yaml
charge_plan:
  active: true
  enabled: true
  from: "22:00"
  start: "22:00"
  start_time: "22:00"
  to: "06:00"
  end: "06:00"
  end_time: "06:00"
  mode_at_start: "now"
  mode_at_end: "pv"
plan:
  active: true
  enabled: true
  id: manual-charge-window
  from: "22:00"
  start: "22:00"
  start_time: "22:00"
  to: "06:00"
  end: "06:00"
  end_time: "06:00"
  mode_at_start: "now"
  mode_at_end: "pv"
```

Mode changes call `select.select_option` on `select.evcc_carport_mode`.
Turning the current plan off also calls `rest_command.evcc_disable_charge` and
sets EVCC mode back to `pv`.

### EV Charger History in Home Assistant

The charger popup history tab now builds recent sessions from Home Assistant's
recorder history instead of calling EVCC directly. Make sure these EVCC entities
exist in HA and are included in `recorder`:

- `binary_sensor.evcc_carport_charging`
- `sensor.evcc_carport_session_energy`
- `sensor.evcc_carport_charge_duration`
- `sensor.evcc_carport_vehicle_soc` (optional, used for a friendlier vehicle label)

Example recorder setup:

```yaml
recorder:
  include:
    entities:
      - binary_sensor.evcc_carport_charging
      - sensor.evcc_carport_session_energy
      - sensor.evcc_carport_charge_duration
      - sensor.evcc_carport_vehicle_soc
```

The dashboard reconstructs session windows from `binary_sensor.evcc_carport_charging`
and uses `sensor.evcc_carport_session_energy` to capture delivered energy for each
session. If recorder excludes those entities, the history tab will stay empty.

Example Home Assistant helpers, REST commands, script, and automations:

```yaml
input_datetime:
  evcc_charge_start:
    name: EVCC charge start
    has_date: false
    has_time: true
  evcc_charge_end:
    name: EVCC charge end
    has_date: false
    has_time: true

input_boolean:
  evcc_charge_plan_enabled:
    name: EVCC charge plan enabled

rest_command:
  evcc_enable_charge:
    url: "http://YOUR_EVCC_HOST/api/loadpoints/1/mode/now"
    method: POST
  evcc_disable_charge:
    url: "http://YOUR_EVCC_HOST/api/loadpoints/1/mode/pv"
    method: POST

script:
  evcc_set_charge_plan:
    alias: EVCC Set Charge Plan
    mode: restart
    fields:
      charge_plan:
        selector:
          object:
    sequence:
      - service: input_datetime.set_datetime
        target:
          entity_id: input_datetime.evcc_charge_start
        data:
          time: "{{ charge_plan.from }}:00"
      - service: input_datetime.set_datetime
        target:
          entity_id: input_datetime.evcc_charge_end
        data:
          time: "{{ charge_plan.to }}:00"
      - choose:
          - conditions: "{{ charge_plan.enabled | bool }}"
            sequence:
              - service: input_boolean.turn_on
                target:
                  entity_id: input_boolean.evcc_charge_plan_enabled
        default:
          - service: input_boolean.turn_off
            target:
              entity_id: input_boolean.evcc_charge_plan_enabled

automation:
  - alias: EVCC Start Planned Charging
    trigger:
      - platform: time
        at: input_datetime.evcc_charge_start
    condition:
      - condition: state
        entity_id: input_boolean.evcc_charge_plan_enabled
        state: "on"
    action:
      - service: select.select_option
        target:
          entity_id: select.evcc_carport_mode
        data:
          option: now
      - service: rest_command.evcc_enable_charge

  - alias: EVCC Stop Planned Charging
    trigger:
      - platform: time
        at: input_datetime.evcc_charge_end
    condition:
      - condition: state
        entity_id: input_boolean.evcc_charge_plan_enabled
        state: "on"
    action:
      - service: select.select_option
        target:
          entity_id: select.evcc_carport_mode
        data:
          option: pv
      - service: rest_command.evcc_disable_charge
      - service: input_boolean.turn_off
        target:
          entity_id: input_boolean.evcc_charge_plan_enabled
```

## Playwright Screenshots

Playwright is installed as a dev dependency for visual QA. On this WSL machine,
Chromium needs Homebrew libraries on the runtime path:

```bash
export LD_LIBRARY_PATH=/home/linuxbrew/.linuxbrew/lib:$LD_LIBRARY_PATH
npm run test:e2e
npx playwright screenshot --viewport-size=1536,864 http://localhost:5173/ /tmp/energy-dashboard.png
```
