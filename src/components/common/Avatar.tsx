import { useState } from 'react'
import { useAvatarUrl } from '../../hooks/useAvatarUrl'

interface AvatarProps {
  name: string
  url?: string | null
  online?: boolean
  size?: number
}

const colors = [
  '#7367f0',
  '#a855f7',
  '#ec4899',
  '#0ea5e9',
  '#14b8a6',
  '#d97706',
  '#6366f1',
]

export default function Avatar({
  name,
  url,
  online = false,
  size = 44,
}: AvatarProps) {
  const resolvedUrl = useAvatarUrl(url)

  const [failedUrl, setFailedUrl] =
    useState<string | null>(null)

  const hash = Array.from(name).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  )

  const initials = name.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('')

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-semibold text-white"
        style={{
          backgroundColor: colors[hash % colors.length],
          fontSize: size * 0.34,
        }}
      >
        {resolvedUrl && resolvedUrl !== failedUrl ? (
          <img
            src={resolvedUrl}
            alt={name}
            onError={() => setFailedUrl(resolvedUrl)}
            className="w-full h-full object-cover"
          />
        ) : initials || '?'}
      </div>

      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-online border-[3px] border-sidebar"
          style={{
            width: Math.max(13, size * 0.3),
            height: Math.max(13, size * 0.3),
          }}
        />
      )}
    </div>
  )
}
