const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-900/50 text-emerald-400',
  trialing: 'bg-yellow-900/50 text-yellow-400',
  canceled: 'bg-zinc-800 text-zinc-300',
  past_due: 'bg-red-900/50 text-red-400',
}

/**
 * Small colored pill for subscription/instance status. Falls back to a neutral
 * zinc style for unknown statuses (e.g. incomplete, provisioning).
 */
export default function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = status || 'none'
  const style = STATUS_STYLES[label] || 'bg-zinc-800 text-zinc-300'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
