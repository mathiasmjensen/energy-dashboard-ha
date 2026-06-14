import { ThemeProvider } from '@hakit/components'
import { HassConnect } from '@hakit/core'
import { EnergyDashboard } from './components/EnergyDashboard'

function App() {
  const hassUrl = import.meta.env.VITE_HA_URL?.trim() || (import.meta.env.PROD ? window.location.origin : '')
  const hassToken = import.meta.env.VITE_HA_TOKEN?.trim() || undefined
  const dashboard = <EnergyDashboard />

  if (!hassUrl) {
    return dashboard
  }

  return (
    <HassConnect
      hassUrl={hassUrl}
      hassToken={hassToken}
      loading={dashboard}
      wrapperProps={{ className: 'hakit-shell' }}
    >
      <ThemeProvider />
      {dashboard}
    </HassConnect>
  )
}

export default App
