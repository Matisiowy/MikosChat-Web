import { useEffect, useState } from 'react'
import { groupsApi } from '../api/groups'
import { useAuthStore } from '../stores/auth.store'
import { useRealtimeStore } from '../stores/realtime.store'

interface LoadedAvatar {
  source: string
  userId: string
  objectUrl: string
}

export function useAvatarUrl(url?: string | null) {
  const userId = useAuthStore(state => state.user?.id)
  const connected = useRealtimeStore(state => state.connected)

  const [loaded, setLoaded] =
    useState<LoadedAvatar | null>(null)

  const isPrivate = Boolean(
    url?.startsWith('/api/v1/media/group-avatars/'),
  )

  useEffect(() => {
    if (!url || !isPrivate || !userId) return

    const controller = new AbortController()

    let active = true
    let objectUrl: string | null = null

    void groupsApi.downloadAvatar(
      url,
      controller.signal,
    ).then(blob => {
      if (!active) return

      objectUrl = URL.createObjectURL(blob)

      setLoaded({
        source: url,
        userId,
        objectUrl,
      })
    }).catch(() => {
      if (active) setLoaded(null)
    })

    return () => {
      active = false
      controller.abort()

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [url, isPrivate, userId, connected])

  if (!isPrivate) {
    return url ?? null
  }

  if (
    loaded &&
    loaded.source === url &&
    loaded.userId === userId
  ) {
    return loaded.objectUrl
  }

  return null
}
