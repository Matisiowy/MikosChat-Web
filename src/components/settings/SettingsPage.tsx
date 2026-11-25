import AvatarEditor from './AvatarEditor'
import { useState } from 'react'
import {
  UserRound,
  Shield,
  ArrowLeft,
  Check,
  LoaderCircle,
  Mail,
  AtSign,
  LockKeyhole,
} from 'lucide-react'

import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import Avatar from '../common/Avatar'
import { useAuthStore } from '../../stores/auth.store'
import { settingsApi } from '../../api/settings'
import { getApiError } from '../../api/client'

type SettingsTab = 'profile' | 'privacy'

interface Props {
  onBack: () => void
}

export default function SettingsPage({ onBack }: Props) {
  const user = useAuthStore(state => state.user!)
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<SettingsTab>('profile')
  const [displayName, setDisplayName] = useState(user.displayName)
  const [bio, setBio] = useState(user.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [unblocking, setUnblocking] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const dirty =
    displayName.trim() !== user.displayName ||
    bio.trim() !== (user.bio ?? '')

  const blocks = useQuery({
    queryKey: ['blocks'],
    queryFn: settingsApi.blockedUsers,
    enabled: tab === 'privacy',
  })

  async function save() {
    if (!displayName.trim() || saving) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await settingsApi.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
      })

      await queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })

      await queryClient.invalidateQueries({
        queryKey: ['friends'],
      })

      setSuccess('Zmiany zostały zapisane.')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setSaving(false)
    }
  }

  async function unblock(id: string) {
    if (!window.confirm('Odblokować tego użytkownika?')) return

    setUnblocking(id)
    setError('')
    setSuccess('')

    try {
      await settingsApi.unblock(id)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['blocks'] }),
        queryClient.invalidateQueries({ queryKey: ['friends'] }),
        queryClient.invalidateQueries({ queryKey: ['presence'] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ])

      setSuccess('Użytkownik został odblokowany.')
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setUnblocking(null)
    }
  }

  const items = [
    { id: 'profile', label: 'Mój profil', icon: UserRound },
    { id: 'privacy', label: 'Prywatność', icon: Shield },
  ] as const

  return (
    <div className="flex flex-col md:flex-row flex-1 min-w-0 min-h-0">

      <aside className="md:w-[280px] shrink-0 bg-sidebar border-b md:border-b-0 md:border-r border-border p-4">

        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onBack}
            className="text-muted hover:text-white"
            title="Wróć do rozmów"
          >
            <ArrowLeft size={21} />
          </button>

          <h1 className="text-xl font-bold">Ustawienia</h1>
        </div>

        <div className="flex md:flex-col gap-1">
          {items.map(item => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id)
                  setError('')
                  setSuccess('')
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  tab === item.id
                    ? 'bg-primary/20 text-primary-hover'
                    : 'text-muted hover:bg-surface'
                }`}
              >
                <Icon size={19} />
                {item.label}
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex-1 min-w-0 overflow-y-auto p-5 md:p-10">

        <div className="max-w-[720px] mx-auto">

          {tab === 'profile' && (
            <>
              <h2 className="text-2xl font-bold">Mój profil</h2>

              <p className="text-muted text-sm mt-2">
                Zarządzaj informacjami widocznymi dla innych użytkowników.
              </p>

              <AvatarEditor />

              <form
                onSubmit={event => {
                  event.preventDefault()
                  void save()
                }}
                className="space-y-6"
              >

                <div className="border-t border-border pt-6">
                  <label className="block text-sm font-medium mb-2">
                    Nazwa wyświetlana
                  </label>

                  <input
                    value={displayName}
                    onChange={event => setDisplayName(event.target.value)}
                    maxLength={64}
                    required
                    className="w-full bg-surface rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary"
                  />

                  <p className="text-xs text-muted mt-2">
                    Tak będą widzieć Cię inni użytkownicy.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opis profilu
                  </label>

                  <textarea
                    value={bio}
                    onChange={event => setBio(event.target.value)}
                    placeholder="Napisz coś o sobie..."
                    maxLength={500}
                    rows={4}
                    className="w-full bg-surface rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary resize-none"
                  />

                  <p className="text-xs text-muted text-right mt-1">
                    {bio.length}/500
                  </p>
                </div>

                <div className="border-t border-border pt-6 space-y-4">

                  <h3 className="font-semibold">
                    Informacje o koncie
                  </h3>

                  <div className="bg-sidebar border border-border rounded-xl p-4 flex items-center gap-3">
                    <AtSign size={20} className="text-muted" />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted">
                        Nazwa użytkownika
                      </p>
                      <p className="text-sm truncate">
                        {user.username}
                      </p>
                    </div>

                    <LockKeyhole size={15} className="text-muted" />
                  </div>

                  <div className="bg-sidebar border border-border rounded-xl p-4 flex items-center gap-3">
                    <Mail size={20} className="text-muted" />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted">
                        Adres e-mail
                      </p>
                      <p className="text-sm truncate">
                        {user.email}
                      </p>
                    </div>

                    <LockKeyhole size={15} className="text-muted" />
                  </div>

                  <p className="text-xs text-muted">
                    Konto utworzone: {
                      new Date(user.createdAt).toLocaleDateString('pl-PL')
                    }
                  </p>

                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-5">

                  <button
                    type="button"
                    disabled={!dirty || saving}
                    onClick={() => {
                      setDisplayName(user.displayName)
                      setBio(user.bio ?? '')
                    }}
                    className="px-5 py-3 text-sm text-muted hover:text-white"
                  >
                    Anuluj
                  </button>

                  <button
                    type="submit"
                    disabled={!dirty || saving || !displayName.trim()}
                    className="bg-primary hover:bg-primary-hover rounded-xl px-5 py-3 text-sm font-medium flex items-center gap-2"
                  >
                    {saving && (
                      <LoaderCircle size={16} className="animate-spin" />
                    )}

                    Zapisz zmiany
                  </button>

                </div>
              </form>
            </>
          )}

          {tab === 'privacy' && (
            <>
              <h2 className="text-2xl font-bold">Prywatność</h2>

              <p className="text-muted text-sm mt-2">
                Zarządzaj zablokowanymi użytkownikami.
              </p>

              <h3 className="font-semibold mt-8 mb-4">
                Zablokowane konta
              </h3>

              {blocks.isPending && (
                <LoaderCircle className="animate-spin text-primary" />
              )}

              {blocks.isError && (
                <p className="text-danger text-sm">
                  Nie udało się pobrać listy.
                </p>
              )}

              {blocks.isSuccess && blocks.data.length === 0 && (
                <div className="bg-sidebar border border-border rounded-2xl p-8 text-center">
                  <Shield size={36} className="mx-auto text-muted mb-4" />

                  <p className="text-sm font-medium">
                    Brak zablokowanych użytkowników
                  </p>

                  <p className="text-xs text-muted mt-2">
                    Zablokowane konta pojawią się tutaj.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {blocks.data?.map(block => (
                  <div
                    key={block.id}
                    className="flex items-center gap-3 bg-sidebar border border-border rounded-xl p-4"
                  >
                    <Avatar
                      name={block.blocked.displayName}
                      url={block.blocked.avatarUrl}
                      size={44}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {block.blocked.displayName}
                      </p>

                      <p className="text-xs text-muted truncate">
                        @{block.blocked.username}
                      </p>
                    </div>

                    <button
                      disabled={unblocking !== null}
                      onClick={() => void unblock(block.blockedId)}
                      className="text-xs bg-surface hover:bg-surface-hover rounded-lg px-3 py-2"
                    >
                      {unblocking === block.blockedId
                        ? 'Odblokowywanie...'
                        : 'Odblokuj'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {success && (
            <div role="status" className="mt-5 flex items-center gap-2 text-online text-sm">
              <Check size={18} />
              {success}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-5 text-danger text-sm">
              {error}
            </div>
          )}

        </div>
      </section>
    </div>
  )
}
