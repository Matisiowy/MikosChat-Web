import { useRef, useState } from 'react'
import { Camera, Trash2, LoaderCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import Avatar from '../common/Avatar'
import { groupsApi } from '../../api/groups'
import { getApiError } from '../../api/client'

interface Props {
  conversationId: string
  name: string
  avatarUrl?: string | null
  canManage: boolean
}

export default function GroupAvatarEditor({
  conversationId,
  name,
  avatarUrl,
  canManage,
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationId],
      }),
    ])
  }

  async function upload(file?: File) {
    if (!file || busy || !canManage) return

    setError('')

    if (file.size > 5 * 1024 * 1024) {
      setError('Zdjęcie nie może przekraczać 5 MB.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Wybierz zdjęcie JPG, PNG lub WebP.')
      return
    }

    setBusy(true)

    try {
      await groupsApi.uploadAvatar(conversationId, file)
      await refresh()
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (busy || !canManage) return

    if (!window.confirm('Usunąć zdjęcie grupy?')) return

    setBusy(true)
    setError('')

    try {
      await groupsApi.removeAvatar(conversationId)
      await refresh()
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 py-5">

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void upload(file)
        }}
      />

      <button
        type="button"
        disabled={!canManage || busy}
        onClick={() => input.current?.click()}
        aria-label="Zmień zdjęcie grupy"
        className="relative group rounded-full"
      >
        <Avatar
          name={name}
          url={avatarUrl}
          size={96}
        />

        {canManage && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={26} />
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
            <LoaderCircle
              size={26}
              className="animate-spin"
            />
          </div>
        )}
      </button>

      <h3 className="text-lg font-semibold text-center break-words max-w-full">
        {name}
      </h3>

      {canManage && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover rounded-lg px-3 py-2 text-xs"
          >
            <Camera size={15} />
            Zmień zdjęcie
          </button>

          {avatarUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="flex items-center gap-2 bg-surface hover:bg-surface-hover text-danger rounded-lg px-3 py-2 text-xs"
            >
              <Trash2 size={15} />
              Usuń
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-danger text-xs text-center">
          {error}
        </p>
      )}
    </div>
  )
}
