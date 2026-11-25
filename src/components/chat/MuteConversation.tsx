import { useEffect, useState } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Bell,
  BellOff,
  X,
  LoaderCircle,
} from 'lucide-react'

import {
  conversationSettingsApi,
} from '../../api/conversation-settings'

import type {
  MuteDuration,
} from '../../api/conversation-settings'

import { getApiError } from '../../api/client'

interface Props {
  conversationId: string
  compact?: boolean
}

const durations: {
  value: MuteDuration
  label: string
}[] = [
  { value: 15, label: 'Na 15 minut' },
  { value: 60, label: 'Na godzinę' },
  { value: 480, label: 'Na 8 godzin' },
  { value: 1440, label: 'Na 24 godziny' },
  { value: -1, label: 'Do ponownego włączenia' },
]

export default function MuteConversation({
  conversationId,
  compact = false,
}: Props) {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [duration, setDuration] =
    useState<MuteDuration>(60)

  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  const queryKey = [
    'conversation-settings',
    conversationId,
  ]

  const settings = useQuery({
    queryKey,
    queryFn: () =>
      conversationSettingsApi.get(conversationId),
    refetchOnWindowFocus: true,
    staleTime: 15000,
  })

  const mutedUntil = settings.data?.mutedUntil

  const muted = Boolean(
    mutedUntil &&
    new Date(mutedUntil).getTime() > now
  )

  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(Date.now()),
      1000,
    )

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setOpen(false)
    setError('')
  }, [conversationId])

  const mutation = useMutation({
    mutationFn: (value: MuteDuration | null) =>
      value === null
        ? conversationSettingsApi.unmute(conversationId)
        : conversationSettingsApi.mute(
            conversationId,
            value,
          ),

    onSuccess: async () => {
      setNow(Date.now())

      await queryClient.invalidateQueries({
        queryKey,
      })

      setOpen(false)
      setError('')
    },

    onError: error => {
      setError(getApiError(error))
    },
  })

  const label = muted
    ? 'Włącz powiadomienia'
    : 'Wycisz powiadomienia'

  return (
    <>
      <button
        type="button"
        title={label}
        aria-label={label}
        disabled={settings.isPending || mutation.isPending}
        onClick={() => {
          setError('')
          setOpen(true)
        }}
        className={compact
          ? `w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface ${
              muted ? 'text-primary-hover' : 'text-muted'
            }`
          : 'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface text-sm text-left'
        }
      >
        {muted ? (
          <BellOff size={19} className="text-primary-hover" />
        ) : (
          <Bell size={19} />
        )}

        {!compact && <span>{label}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!mutation.isPending) setOpen(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="w-full max-w-sm bg-sidebar border border-border rounded-2xl shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <header className="flex items-center gap-3 p-5 border-b border-border">
              <BellOff
                size={22}
                className="text-primary-hover"
              />

              <h2 className="font-semibold flex-1">
                {label}
              </h2>

              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => setOpen(false)}
                className="text-muted p-1"
                aria-label="Zamknij"
              >
                <X size={20} />
              </button>
            </header>

            <div className="p-5">
              {settings.isError ? (
                <div>
                  <p className="text-danger text-sm">
                    Nie udało się pobrać ustawień.
                  </p>

                  <button
                    type="button"
                    onClick={() => void settings.refetch()}
                    className="text-primary-hover text-sm mt-3"
                  >
                    Spróbuj ponownie
                  </button>
                </div>
              ) : muted ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    Powiadomienia są wyciszone.
                  </p>

                  <p className="text-xs text-muted">
                    {mutedUntil?.startsWith('9999')
                      ? 'Do ponownego włączenia.'
                      : `Do ${new Date(mutedUntil!).toLocaleString('pl-PL')}`}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted leading-relaxed mb-4">
                    Nadal będziesz otrzymywać wiadomości.
                    Ustawienie dotyczy powiadomień.
                  </p>

                  <div className="space-y-1">
                    {durations.map(item => (
                      <label
                        key={item.value}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface cursor-pointer text-sm"
                      >
                        <input
                          type="radio"
                          name="mute-duration"
                          checked={duration === item.value}
                          onChange={() => setDuration(item.value)}
                          disabled={mutation.isPending}
                          className="accent-primary w-4 h-4"
                        />

                        {item.label}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {error && (
                <p role="alert" className="text-danger text-xs mt-3">
                  {error}
                </p>
              )}
            </div>

            <footer className="flex gap-2 p-5 border-t border-border">
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => setOpen(false)}
                className="flex-1 bg-surface hover:bg-surface-hover rounded-xl py-3 text-sm"
              >
                Anuluj
              </button>

              <button
                type="button"
                disabled={
                  mutation.isPending ||
                  settings.isError ||
                  settings.isPending
                }
                onClick={() =>
                  mutation.mutate(muted ? null : duration)
                }
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover rounded-xl py-3 text-sm disabled:opacity-40"
              >
                {mutation.isPending && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                {muted ? 'Włącz' : 'Wycisz'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
