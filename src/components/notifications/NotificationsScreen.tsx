import { cn } from '../../lib/cn'
import type { NotificationPreferences, NotificationsState } from '../../models/notifications'
import { DataStateBadge, OverviewIcon, Panel, StatusPill } from '../dashboard/desktop/DesktopShared'
import { GlassCard, MobileDataStateBadge, MobileIcon, SectionHeading, StatusChip } from '../mobile/MobilePrimitives'

type NotificationController = Pick<ReturnType<typeof import('../../hooks/useNotifications').useNotifications>, 'disable' | 'enable' | 'refresh'>

const PREFERENCE_ITEMS: Array<{ description: string; key: keyof NotificationPreferences; label: string }> = [
  { description: 'Plan changes, stale data, and optimizer actions.', key: 'batteryOptimizer', label: 'Battery optimizer' },
  { description: 'Session complete, unplugged, and ready-to-charge alerts.', key: 'evCharging', label: 'EV charging' },
  { description: 'Notify when buy prices drop into the cheap window.', key: 'priceDrops', label: 'Price drops' },
  { description: 'Tell me when forecasted solar surplus is worth using.', key: 'solarSurplus', label: 'Solar surplus' },
]

export function DesktopNotificationsPage({
  controller,
  displayDate,
  displayTime,
  notifications,
  preferences,
  setPreference,
  weather,
}: {
  controller: NotificationController
  displayDate: string
  displayTime: string
  notifications: NotificationsState
  preferences: NotificationPreferences
  setPreference: (key: keyof NotificationPreferences, value: boolean) => void
  weather: {
    condition: string
    temperature: string
  }
}) {
  return (
    <section
      className="absolute left-[236px] right-0 top-0 h-[941px] overflow-hidden px-8 pb-6 pr-7 pt-6"
      aria-label="Notifications"
    >
      <header className="flex h-[70px] items-start justify-between">
        <div>
          <h1 className="m-0 text-[24px] leading-[1.1] text-white">Notifications</h1>
          <p className="mt-[7px] text-[15px] text-[#d7dbe1]">Push alerts, delivery status, and recent dashboard activity.</p>
        </div>
        <div className="fixed left-[1196px] top-[31px] z-[3] grid grid-cols-[126px_146px_142px] gap-6">
          <StatusPill icon="sun" primary={weather.temperature} secondary={weather.condition} tone="sun" />
          <StatusPill icon="clock" primary={displayTime} secondary={displayDate} />
          <StatusPill primary="All systems" secondary="Normal" tone="ok" />
        </div>
      </header>

      <div className="grid h-[calc(100%-82px)] min-h-0 grid-cols-[minmax(0,0.9fr)_minmax(320px,0.72fr)] gap-5">
        <section className="grid min-h-0 gap-5">
          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] font-semibold leading-none tracking-[-0.01em] text-white">Notification center</h2>
                <NotificationSourceBadge notifications={notifications} desktop />
              </div>
              <div className="flex items-center gap-2">
                <ActionButton label={notifications.isSyncing ? 'Refreshing...' : 'Refresh'} variant="secondary" onClick={() => void controller.refresh()} />
                <ActionButton
                  label={notifications.isSubscribed ? (notifications.isSyncing ? 'Turning off...' : 'Turn off') : notifications.isSyncing ? 'Turning on...' : 'Turn on'}
                  variant="primary"
                  onClick={() => void (notifications.isSubscribed ? controller.disable() : controller.enable())}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-4">
              <NotificationStat label="Permission" value={formatPermission(notifications.permission)} />
              <NotificationStat label="Subscription" value={notifications.isSubscribed ? 'Active' : 'Inactive'} tone={notifications.isSubscribed ? 'green' : 'neutral'} />
              <NotificationStat label="Backend" value={notifications.backendAvailable ? 'Connected' : 'Unavailable'} tone={notifications.backendAvailable ? 'green' : 'danger'} />
              <NotificationStat label="Last sync" value={notifications.lastSyncedAt ? formatTimestamp(notifications.lastSyncedAt) : 'Not yet'} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[20px] border border-white/8 bg-[#0b111d]/88 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-2">
                  <OverviewIcon name="history" />
                  <strong className="text-[15px] font-semibold text-dashboard-text">How this is wired</strong>
                </div>
                <p className="mt-3 text-sm leading-6 text-dashboard-soft">
                  The dashboard subscribes this device to the standalone web-push service. Home Assistant can then publish alerts through that backend without exposing your browser directly to the internet.
                </p>
                {notifications.errorMessage ? (
                  <div className="mt-4 rounded-[16px] border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    {notifications.errorMessage}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[20px] border border-white/8 bg-[#0b111d]/88 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
                <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-dashboard-muted">Endpoint</span>
                <strong className="mt-3 block break-all text-sm font-semibold text-dashboard-text">
                  {notifications.endpoint ?? 'No active push subscription yet'}
                </strong>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-semibold text-white">Alert preferences</h2>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {PREFERENCE_ITEMS.map((item) => (
                <PreferenceCard
                  key={item.key}
                  checked={preferences[item.key]}
                  description={item.description}
                  label={item.label}
                  onChange={(checked) => setPreference(item.key, checked)}
                />
              ))}
            </div>
          </Panel>
        </section>

        <aside className="flex min-h-0 flex-col">
          <Panel className="flex min-h-0 flex-1 flex-col p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] font-semibold text-white">Recent alerts</h2>
                <span className="inline-flex h-[24px] items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[11px] text-dashboard-soft">
                  {notifications.history.length}
                </span>
              </div>
            </div>

            <div className="mt-5 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {notifications.history.length ? (
                notifications.history.map((item) => (
                  <HistoryCard key={item.id} body={item.body} sentAt={item.sentAt} tag={item.tag} title={item.title} url={item.url} />
                ))
              ) : (
                <EmptyHistoryState
                  message={
                    notifications.isSubscribed
                      ? 'No notifications have been delivered yet.'
                      : 'Turn notifications on to start receiving alert history here.'
                  }
                />
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </section>
  )
}

export function MobileNotificationsScreen({
  controller,
  notifications,
  preferences,
  setPreference,
}: {
  controller: NotificationController
  notifications: NotificationsState
  preferences: NotificationPreferences
  setPreference: (key: keyof NotificationPreferences, value: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-4 pb-2">
      <GlassCard className="rounded-[26px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SectionHeading title="Notifications" />
            <NotificationSourceBadge notifications={notifications} />
          </div>
          <StatusChip tone={notifications.isSubscribed ? 'green' : 'neutral'}>
            <MobileIcon name="bell" />
          </StatusChip>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MobileNotificationStat label="Permission" value={formatPermission(notifications.permission)} />
          <MobileNotificationStat label="Subscription" value={notifications.isSubscribed ? 'Active' : 'Inactive'} />
          <MobileNotificationStat label="Backend" value={notifications.backendAvailable ? 'Connected' : 'Unavailable'} />
          <MobileNotificationStat label="Last sync" value={notifications.lastSyncedAt ? formatTimestamp(notifications.lastSyncedAt) : 'Not yet'} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ActionButton label={notifications.isSyncing ? 'Refreshing...' : 'Refresh'} variant="secondary" onClick={() => void controller.refresh()} />
          <ActionButton
            label={notifications.isSubscribed ? (notifications.isSyncing ? 'Turning off...' : 'Turn off') : notifications.isSyncing ? 'Turning on...' : 'Turn on'}
            variant="primary"
            onClick={() => void (notifications.isSubscribed ? controller.disable() : controller.enable())}
          />
        </div>

        {notifications.errorMessage ? (
          <div className="mt-4 rounded-[18px] border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {notifications.errorMessage}
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="rounded-[24px] p-4">
        <div className="flex items-center justify-between gap-2">
          <SectionHeading title="Alert preferences" />
        </div>
        <div className="mt-4 grid gap-3">
          {PREFERENCE_ITEMS.map((item) => (
            <PreferenceCard
              key={item.key}
              checked={preferences[item.key]}
              description={item.description}
              label={item.label}
              mobile
              onChange={(checked) => setPreference(item.key, checked)}
            />
          ))}
        </div>
      </GlassCard>

      <GlassCard className="rounded-[24px] p-4">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading title="Recent alerts" />
          <div className="inline-flex min-h-7 items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[11px] text-dashboard-soft">
            {notifications.history.length}
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {notifications.history.length ? (
            notifications.history.map((item) => (
              <HistoryCard key={item.id} body={item.body} mobile sentAt={item.sentAt} tag={item.tag} title={item.title} url={item.url} />
            ))
          ) : (
            <EmptyHistoryState
              message={
                notifications.isSubscribed
                  ? 'No notifications have been delivered yet.'
                  : 'Turn notifications on to start receiving alert history here.'
              }
              mobile
            />
          )}
        </div>
      </GlassCard>
    </div>
  )
}

function NotificationSourceBadge({
  desktop = false,
  notifications,
}: {
  desktop?: boolean
  notifications: NotificationsState
}) {
  const badge = notifications.backendAvailable
    ? { label: 'Live', tone: 'live' as const }
    : notifications.supported
      ? { label: 'Setup', tone: 'stale' as const }
      : { label: 'Mock', tone: 'mock' as const }

  return desktop ? <DataStateBadge badge={badge} /> : <MobileDataStateBadge badge={badge} />
}

function NotificationStat({
  label,
  tone = 'neutral',
  value,
}: {
  label: string
  tone?: 'danger' | 'green' | 'neutral'
  value: string
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#0b111d]/88 px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
      <strong
        className={cn(
          'mt-2 block text-[1rem] font-semibold',
          tone === 'green' && 'text-emerald-300',
          tone === 'danger' && 'text-rose-300',
          tone === 'neutral' && 'text-dashboard-text',
        )}
      >
        {value}
      </strong>
    </div>
  )
}

function MobileNotificationStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#0b111d]/88 px-3 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
      <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-dashboard-muted">{label}</span>
      <strong className="mt-2 block text-[13px] font-semibold text-dashboard-text">{value}</strong>
    </div>
  )
}

function PreferenceCard({
  checked,
  description,
  label,
  mobile = false,
  onChange,
}: {
  checked: boolean
  description: string
  label: string
  mobile?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-[18px] border border-white/8 bg-[#0b111d]/88 shadow-[0_12px_28px_rgba(0,0,0,0.16)]',
        mobile ? 'px-4 py-3' : 'px-4 py-4',
      )}
    >
      <div className="min-w-0">
        <strong className="block text-[14px] font-semibold text-dashboard-text">{label}</strong>
        <span className="mt-1 block text-[12px] leading-5 text-dashboard-soft">{description}</span>
      </div>
      <button
        aria-pressed={checked}
        className={cn(
          'relative mt-1 inline-flex h-7 w-12 shrink-0 rounded-full border transition',
          checked ? 'border-emerald-400/30 bg-emerald-400/20' : 'border-white/10 bg-white/8',
        )}
        type="button"
        onClick={() => onChange(!checked)}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition',
            checked ? 'left-[25px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

function HistoryCard({
  body,
  mobile = false,
  sentAt,
  tag,
  title,
  url,
}: {
  body: string
  mobile?: boolean
  sentAt: string
  tag: string | null
  title: string
  url: string | null
}) {
  return (
    <article
      className={cn(
        'rounded-[18px] border border-white/8 bg-[#0b111d]/88 shadow-[0_12px_28px_rgba(0,0,0,0.16)]',
        mobile ? 'px-4 py-3' : 'px-4 py-4',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block text-[14px] font-semibold text-dashboard-text">{title}</strong>
          <span className="mt-1 block text-[12px] leading-5 text-dashboard-soft">{body}</span>
        </div>
        <StatusChip tone="neutral">
          <MobileIcon name="bell" />
        </StatusChip>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-dashboard-muted">
        <span>{formatTimestamp(sentAt)}</span>
        {tag ? <span className="inline-flex h-6 items-center rounded-full border border-white/10 bg-white/[0.04] px-2">{tag}</span> : null}
        {url ? <span className="inline-flex h-6 items-center rounded-full border border-white/10 bg-white/[0.04] px-2">{url}</span> : null}
      </div>
    </article>
  )
}

function EmptyHistoryState({ message, mobile = false }: { message: string; mobile?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] text-center text-dashboard-soft',
        mobile ? 'px-4 py-5' : 'px-5 py-8',
      )}
    >
      {message}
    </div>
  )
}

function ActionButton({
  label,
  onClick,
  variant,
}: {
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary'
}) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-[16px] px-4 text-sm font-semibold transition',
        variant === 'primary'
          ? 'bg-[linear-gradient(135deg,#71e06d,#45c95f)] text-[#041108] shadow-[0_18px_36px_rgba(89,214,99,0.28)] hover:brightness-105'
          : 'border border-white/10 bg-white/[0.05] text-dashboard-text hover:border-white/20 hover:bg-white/[0.08]',
      )}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function formatPermission(permission: NotificationsState['permission']) {
  if (permission === 'granted') return 'Granted'
  if (permission === 'denied') return 'Blocked'
  if (permission === 'default') return 'Ask first'
  return 'Unsupported'
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString([], {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  })
}
