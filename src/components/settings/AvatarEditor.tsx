import { useRef, useState } from 'react'
import {
  Camera,
  Trash2,
  LoaderCircle,
  Check,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import Avatar from '../common/Avatar'
import { useAuthStore } from '../../stores/auth.store'
import { settingsApi } from '../../api/settings'
import { getApiError } from '../../api/client'

export default function AvatarEditor() {
  const user = useAuthStore(state => state.user!)
  const input = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function refresh() {
    await queryClient.invalidateQueries()
  }

  async function upload(file?: File) {
    if (!file || busy) return

    setError('')
    setSuccess('')

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
      await settingsApi.uploadAvatar(file)
      await refresh()
      setSuccess('Zdjęcie profilowe zostało zmienione.')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (busy) return

    if (!window.confirm('Usunąć zdjęcie profilowe?')) {
      return
    }

    setBusy(true)
    setError('')
    setSuccess('')

    try {
      await settingsApi.removeAvatar()
      await refresh()
      setSuccess('Zdjęcie profilowe zostało usunięte.')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="py-8">

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

      <div className="flex flex-wrap items-center gap-5">

        <button
          type="button"
          disabled={busy}
          title="Zmień zdjęcie profilowe"
          aria-label="Zmień zdjęcie profilowe"
          onClick={() => input.current?.click()}
          className="relative group rounded-full"
        >
          <Avatar
            name={user.displayName}
            url={user.avatarUrl}
            size={96}
          />

          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera size={25} />
          </div>

          {busy && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <LoaderCircle
                size={25}
                className="animate-spin"
              />
            </div>
          )}
        </button>

        <div className="min-w-0 flex-1">

          <h3 className="font-semibold text-lg truncate">
            {user.displayName}
          </h3>

          <p className="text-muted text-sm">
            @{user.username}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">

            <button
              type="button"
              disabled={busy}
              onClick={() => input.current?.click()}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover rounded-lg px-3 py-2 text-sm"
            >
              <Camera size={16} />
              Zmień zdjęcie
            </button>

            {user.avatarUrl && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="flex items-center gap-2 bg-surface hover:bg-surface-hover text-danger rounded-lg px-3 py-2 text-sm"
              >
                <Trash2 size={16} />
                Usuń
              </button>
            )}

          </div>

          <p className="text-xs text-muted mt-2">
            JPG, PNG lub WebP. Maksymalnie 5 MB.
          </p>

        </div>
      </div>

      {success && (
        <div role="status" className="flex items-center gap-2 text-online text-sm mt-4">
          <Check size={16} />
          {success}
        </div>
      )}

      {error && (
        <p role="alert" className="text-danger text-sm mt-4">
          {error}
        </p>
      )}

    </div>
  )
}
