import { useState } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  X,
  UsersRound,
  Search,
  Check,
  LoaderCircle,
} from 'lucide-react'

import Avatar from '../common/Avatar'
import { chatApi } from '../../api/chat'
import { getApiError } from '../../api/client'

interface Props {
  onClose: () => void
  onCreated: (id: string) => void
}

export default function CreateGroupDialog({
  onClose,
  onCreated,
}: Props) {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')

  const friends = useQuery({
    queryKey: ['friends'],
    queryFn: chatApi.friends,
  })

  const create = useMutation({
    mutationFn: () =>
      chatApi.createGroup(name.trim(), selected),

    onSuccess: conversation => {
      queryClient.setQueryData(
        ['conversation', conversation.id],
        conversation,
      )

      void queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })

      onCreated(conversation.id)
    },

    onError: error => {
      setError(getApiError(error))
    },
  })

  function toggle(id: string) {
    if (create.isPending) return

    setSelected(current => {
      if (current.includes(id)) {
        return current.filter(item => item !== id)
      }

      if (current.length >= 49) return current

      return [...current, id]
    })
  }

  const filtered = (friends.data ?? []).filter(friend => {
    const query = search.trim().toLowerCase()

    return (
      friend.user.displayName.toLowerCase().includes(query) ||
      friend.user.username.toLowerCase().includes(query)
    )
  })

  const valid =
    name.trim().length >= 1 &&
    name.trim().length <= 100 &&
    selected.length >= 2 &&
    selected.length <= 49

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => {
        if (!create.isPending) onClose()
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
        className="w-full max-w-md max-h-[90dvh] flex flex-col bg-sidebar border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={event => event.stopPropagation()}
        onSubmit={event => {
          event.preventDefault()

          if (!valid || create.isPending) return

          setError('')
          create.mutate()
        }}
      >
        <header className="flex items-center gap-3 p-5 border-b border-border">
          <UsersRound
            size={23}
            className="text-primary-hover"
          />

          <h2
            id="create-group-title"
            className="text-xl font-bold flex-1"
          >
            Nowa grupa
          </h2>

          <button
            type="button"
            disabled={create.isPending}
            onClick={onClose}
            aria-label="Zamknij"
            className="p-2 rounded-lg text-muted hover:bg-surface"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-5">

          <div className="flex justify-center mb-5">
            {name.trim() ? (
              <Avatar name={name} size={76} />
            ) : (
              <div className="w-[76px] h-[76px] rounded-full bg-primary/15 text-primary-hover flex items-center justify-center">
                <UsersRound size={34} />
              </div>
            )}
          </div>

          <label className="block text-xs font-semibold text-muted mb-2">
            Nazwa grupy
          </label>

          <input
            autoFocus
            value={name}
            disabled={create.isPending}
            maxLength={100}
            onChange={event => setName(event.target.value)}
            placeholder="Wpisz nazwę grupy..."
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex justify-end text-[10px] text-muted mt-1">
            {name.length}/100
          </div>

          <div className="flex items-center justify-between mt-5 mb-3">
            <h3 className="text-sm font-semibold">
              Wybierz uczestników
            </h3>

            <span className="text-xs text-primary-hover">
              {selected.length}/49
            </span>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {friends.data
                ?.filter(friend => selected.includes(friend.user.id))
                .map(friend => (
                  <button
                    type="button"
                    key={friend.user.id}
                    disabled={create.isPending}
                    onClick={() => toggle(friend.user.id)}
                    className="flex items-center gap-2 bg-primary/15 text-primary-hover rounded-full pl-1 pr-2 py-1 text-xs"
                  >
                    <Avatar
                      name={friend.user.displayName}
                      url={friend.user.avatarUrl}
                      size={24}
                    />

                    <span className="max-w-24 truncate">
                      {friend.user.displayName}
                    </span>

                    <X size={13} />
                  </button>
                ))}
            </div>
          )}

          <div className="relative mb-3">
            <Search
              size={17}
              className="absolute left-3 top-3 text-muted"
            />

            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Szukaj znajomych..."
              className="w-full bg-surface rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {friends.isPending && (
            <LoaderCircle className="animate-spin text-primary mx-auto my-6" />
          )}

          {friends.isError && (
            <div className="text-center py-5">
              <p className="text-danger text-sm">
                Nie udało się pobrać znajomych.
              </p>

              <button
                type="button"
                onClick={() => void friends.refetch()}
                className="text-primary-hover text-xs mt-2"
              >
                Spróbuj ponownie
              </button>
            </div>
          )}

          {friends.isSuccess && filtered.length === 0 && (
            <p className="text-muted text-sm text-center py-6">
              {search
                ? 'Nie znaleziono znajomych.'
                : 'Nie masz jeszcze znajomych.'}
            </p>
          )}

          <div className="space-y-1">
            {filtered.map(friend => {
              const checked = selected.includes(friend.user.id)

              return (
                <button
                  type="button"
                  key={friend.user.id}
                  disabled={
                    create.isPending ||
                    (!checked && selected.length >= 49)
                  }
                  aria-pressed={checked}
                  onClick={() => toggle(friend.user.id)}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    checked
                      ? 'bg-primary/10'
                      : 'hover:bg-surface'
                  }`}
                >
                  <Avatar
                    name={friend.user.displayName}
                    url={friend.user.avatarUrl}
                    size={42}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {friend.user.displayName}
                    </p>

                    <p className="text-xs text-muted truncate">
                      @{friend.user.username}
                    </p>
                  </div>

                  <div className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    checked
                      ? 'bg-primary border-primary text-white'
                      : 'border-muted'
                  }`}>
                    {checked && <Check size={15} />}
                  </div>
                </button>
              )
            })}
          </div>

          {error && (
            <p role="alert" className="text-danger text-xs mt-4">
              {error}
            </p>
          )}
        </div>

        <footer className="p-5 border-t border-border">

          <p className="text-xs text-muted text-center mb-3">
            {selected.length < 2
              ? 'Wybierz minimum dwóch znajomych.'
              : `Grupa będzie miała ${selected.length + 1} uczestników.`}
          </p>

          <button
            type="submit"
            disabled={!valid || create.isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 font-semibold text-sm transition-colors"
          >
            {create.isPending ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Tworzenie grupy...
              </>
            ) : (
              <>
                <UsersRound size={18} />
                Utwórz grupę
              </>
            )}
          </button>
        </footer>
      </form>
    </div>
  )
}
