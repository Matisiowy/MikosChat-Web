import MuteConversation from '../chat/MuteConversation'
import { useState } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  X,
  Pencil,
  UsersRound,
  UserPlus,
  UserMinus,
  Shield,
  Crown,
  LogOut,
  Check,
  Search,
  LoaderCircle,
  ChevronDown,
} from 'lucide-react'

import Avatar from '../common/Avatar'
import GroupAvatarEditor from './GroupAvatarEditor'

import { groupsApi } from '../../api/groups'
import { chatApi } from '../../api/chat'
import { getApiError } from '../../api/client'

import type { Conversation } from '../../types/chat'

interface Props {
  conversation: Conversation
  userId: string
  onClose: () => void
  onLeave: () => void
}

const roleNames = {
  OWNER: 'Właściciel',
  ADMIN: 'Administrator',
  MEMBER: 'Uczestnik',
}

const roleOrder = {
  OWNER: 0,
  ADMIN: 1,
  MEMBER: 2,
}

export default function GroupDetailsPanel({
  conversation,
  userId,
  onClose,
  onLeave,
}: Props) {
  const queryClient = useQueryClient()
  const id = conversation.id

  const me = conversation.members.find(
    member => member.userId === userId
  )

  const isOwner = me?.role === 'OWNER'

  const canManage =
    isOwner || me?.role === 'ADMIN'

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const [expandedMember, setExpandedMember] =
    useState<string | null>(null)

  const [error, setError] = useState('')

  const friends = useQuery({
    queryKey: ['friends'],
    queryFn: chatApi.friends,
    enabled: adding && canManage,
  })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      }),
      queryClient.invalidateQueries({
        queryKey: ['conversation', id],
      }),
      queryClient.invalidateQueries({
        queryKey: ['messages', id],
      }),
    ])
  }

  const action = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: refresh,
    onError: error => setError(getApiError(error)),
  })

  async function run(fn: () => Promise<unknown>) {
    if (action.isPending) return false

    setError('')

    try {
      await action.mutateAsync(fn)
      return true
    } catch {
      return false
    }
  }

  function beginEditing() {
    setName(conversation.name ?? '')
    setDescription(conversation.description ?? '')
    setEditing(true)
    setError('')
  }

  async function saveDetails() {
    if (!canManage || !name.trim()) return

    const success = await run(() =>
      groupsApi.update(id, {
        name: name.trim(),
        description: description.trim(),
      })
    )

    if (success) setEditing(false)
  }

  const memberIds = new Set(
    conversation.members.map(member => member.userId)
  )

  const availableSlots = Math.max(
    0,
    50 - conversation.members.length,
  )

  const eligibleFriends = (friends.data ?? [])
    .filter(friend => !memberIds.has(friend.user.id))

  const filteredFriends = eligibleFriends.filter(friend => {
    const query = search.trim().toLowerCase()

    return (
      friend.user.displayName.toLowerCase().includes(query) ||
      friend.user.username.toLowerCase().includes(query)
    )
  })

  function toggleFriend(friendId: string) {
    if (action.isPending) return

    setSelected(current => {
      if (current.includes(friendId)) {
        return current.filter(item => item !== friendId)
      }

      if (current.length >= availableSlots) {
        return current
      }

      return [...current, friendId]
    })
  }

  async function addMembers() {
    if (!canManage || !selected.length) return

    const ids = selected.filter(
      memberId => !memberIds.has(memberId)
    )

    if (!ids.length || ids.length > availableSlots) return

    const success = await run(() =>
      groupsApi.addMembers(id, ids)
    )

    if (success) {
      setSelected([])
      setAdding(false)
      setSearch('')
    }
  }

  async function leave() {
    if (!me || isOwner || action.isPending) return

    if (!window.confirm('Na pewno chcesz opuścić grupę?')) {
      return
    }

    setError('')

    try {
      await groupsApi.leave(id)

      onLeave()

      await queryClient.cancelQueries({
        queryKey: ['messages', id],
      })

      await queryClient.cancelQueries({
        queryKey: ['conversation', id],
      })

      queryClient.removeQueries({
        queryKey: ['messages', id],
      })

      queryClient.removeQueries({
        queryKey: ['conversation', id],
      })

      void queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })
    } catch (error) {
      setError(getApiError(error))
    }
  }

  const members = [...conversation.members].sort(
    (a, b) =>
      roleOrder[a.role] - roleOrder[b.role] ||
      a.user.displayName.localeCompare(b.user.displayName)
  )

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-[360px] xl:static xl:z-auto xl:w-[340px] shrink-0 bg-sidebar border-l border-border flex flex-col min-h-0 shadow-xl xl:shadow-none">

      <header className="h-[72px] shrink-0 flex items-center gap-3 px-5 border-b border-border">
        <h2 className="font-semibold flex-1">
          Informacje o grupie
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij panel"
          className="p-2 text-muted hover:bg-surface rounded-lg"
        >
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">

        <div className="px-5">
          <GroupAvatarEditor
            conversationId={id}
            name={conversation.name || 'Rozmowa grupowa'}
            avatarUrl={conversation.avatarUrl}
            canManage={canManage}
          />

          <p className="text-xs text-muted text-center mb-4">
            {conversation.members.length} uczestników
          </p>

          {conversation.description && !editing && (
            <p className="text-sm text-muted text-center mb-5 whitespace-pre-wrap break-words">
              {conversation.description}
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="text-xs text-danger px-5 py-3 bg-danger/10"
          >
            {error}
          </p>
        )}

        <section className="border-t border-border p-3">
          <MuteConversation conversationId={id} />
        </section>

        {canManage && (
          <section className="border-t border-border p-3">

            <h3 className="text-xs font-semibold uppercase text-muted px-2 py-3">
              Dostosuj grupę
            </h3>

            {!editing ? (
              <button
                type="button"
                onClick={beginEditing}
                className="w-full flex items-center gap-3 p-3 hover:bg-surface rounded-xl text-left text-sm"
              >
                <Pencil size={18} className="text-primary-hover" />
                Zmień nazwę i opis
              </button>
            ) : (
              <form
                className="space-y-3 p-2"
                onSubmit={event => {
                  event.preventDefault()
                  void saveDetails()
                }}
              >
                <label className="block text-xs text-muted">
                  Nazwa grupy
                </label>

                <input
                  value={name}
                  maxLength={100}
                  onChange={event => setName(event.target.value)}
                  className="w-full bg-surface rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                />

                <label className="block text-xs text-muted">
                  Opis grupy
                </label>

                <textarea
                  value={description}
                  maxLength={500}
                  rows={4}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Dodaj opis grupy..."
                  className="w-full bg-surface rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:ring-1 focus:ring-primary"
                />

                <div className="text-right text-[10px] text-muted">
                  {description.length}/500
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 bg-surface rounded-lg py-2 text-xs"
                  >
                    Anuluj
                  </button>

                  <button
                    type="submit"
                    disabled={!name.trim() || action.isPending}
                    className="flex-1 bg-primary rounded-lg py-2 text-xs disabled:opacity-40"
                  >
                    Zapisz
                  </button>
                </div>
              </form>
            )}

            <button
              type="button"
              disabled={availableSlots === 0}
              onClick={() => {
                setAdding(current => !current)
                setSelected([])
                setSearch('')
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-surface rounded-xl text-left text-sm disabled:opacity-40"
            >
              <UserPlus size={18} className="text-primary-hover" />

              <span className="flex-1">
                Dodaj uczestników
              </span>

              <ChevronDown
                size={16}
                className={adding ? 'rotate-180' : ''}
              />
            </button>

            {adding && (
              <div className="bg-background rounded-xl p-3 mt-2">

                <div className="relative mb-3">
                  <Search
                    size={15}
                    className="absolute left-3 top-3 text-muted"
                  />

                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Szukaj znajomych..."
                    className="w-full bg-surface rounded-lg pl-9 pr-3 py-2.5 text-xs outline-none"
                  />
                </div>

                {friends.isPending && (
                  <LoaderCircle
                    size={20}
                    className="animate-spin mx-auto my-4 text-primary"
                  />
                )}

                {friends.isError && (
                  <p className="text-xs text-danger py-3">
                    Nie udało się pobrać znajomych.
                  </p>
                )}

                {friends.isSuccess && !filteredFriends.length && (
                  <p className="text-xs text-muted text-center py-4">
                    Brak znajomych do dodania.
                  </p>
                )}

                <div className="max-h-56 overflow-y-auto">
                  {filteredFriends.map(friend => {
                    const checked = selected.includes(friend.user.id)

                    return (
                      <button
                        type="button"
                        key={friend.user.id}
                        aria-pressed={checked}
                        disabled={action.isPending}
                        onClick={() => toggleFriend(friend.user.id)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-surface rounded-lg text-left"
                      >
                        <Avatar
                          name={friend.user.displayName}
                          url={friend.user.avatarUrl}
                          size={32}
                        />

                        <span className="flex-1 truncate text-xs">
                          {friend.user.displayName}
                        </span>

                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          checked
                            ? 'bg-primary border-primary'
                            : 'border-muted'
                        }`}>
                          {checked && <Check size={13} />}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  disabled={
                    !selected.length ||
                    selected.length > availableSlots ||
                    action.isPending
                  }
                  onClick={() => void addMembers()}
                  className="w-full bg-primary rounded-lg py-2.5 text-xs mt-3 disabled:opacity-40"
                >
                  Dodaj wybranych ({selected.length})
                </button>
              </div>
            )}

          </section>
        )}

        <section className="border-t border-border p-3">

          <div className="flex items-center gap-2 px-2 py-3">
            <UsersRound size={16} className="text-muted" />

            <h3 className="text-xs uppercase font-semibold text-muted">
              Uczestnicy ({members.length})
            </h3>
          </div>

          {members.map(member => {
            const own = member.userId === userId

            const canRemove =
              !own &&
              member.role !== 'OWNER' &&
              (
                isOwner ||
                (canManage && member.role === 'MEMBER')
              )

            const canChangeRole =
              isOwner &&
              !own &&
              member.role !== 'OWNER'

            const hasActions = canRemove || canChangeRole

            return (
              <div key={member.id}>

                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface">

                  <Avatar
                    name={member.user.displayName}
                    url={member.user.avatarUrl}
                    size={38}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user.displayName}
                      {own && ' (Ty)'}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-muted">

                      {member.role === 'OWNER' && (
                        <Crown size={12} className="text-amber-400" />
                      )}

                      {member.role === 'ADMIN' && (
                        <Shield size={12} className="text-primary-hover" />
                      )}

                      {roleNames[member.role]}
                    </div>
                  </div>

                  {hasActions && (
                    <button
                      type="button"
                      aria-label={`Zarządzaj: ${member.user.displayName}`}
                      aria-expanded={expandedMember === member.userId}
                      onClick={() => setExpandedMember(current =>
                        current === member.userId
                          ? null
                          : member.userId
                      )}
                      className="p-2 text-muted hover:text-foreground"
                    >
                      <ChevronDown
                        size={17}
                        className={
                          expandedMember === member.userId
                            ? 'rotate-180'
                            : ''
                        }
                      />
                    </button>
                  )}
                </div>

                {hasActions && expandedMember === member.userId && (
                  <div className="bg-background rounded-xl p-2 ml-5 mb-2 space-y-1">

                    {canChangeRole && (
                      <>
                        <button
                          type="button"
                          disabled={action.isPending}
                          onClick={() => void run(() =>
                            groupsApi.updateRole(
                              id,
                              member.userId,
                              member.role === 'ADMIN'
                                ? 'MEMBER'
                                : 'ADMIN',
                            )
                          )}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-surface text-xs text-left"
                        >
                          <Shield size={15} />

                          {member.role === 'ADMIN'
                            ? 'Odbierz administratora'
                            : 'Nadaj administratora'}
                        </button>

                        <button
                          type="button"
                          disabled={action.isPending}
                          onClick={() => {
                            if (window.confirm(
                              `Przekazać własność grupy użytkownikowi ${member.user.displayName}?`
                            )) {
                              void run(() =>
                                groupsApi.transferOwner(
                                  id,
                                  member.userId,
                                )
                              )
                            }
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-surface text-xs text-left text-amber-400"
                        >
                          <Crown size={15} />
                          Przekaż własność
                        </button>
                      </>
                    )}

                    {canRemove && (
                      <button
                        type="button"
                        disabled={action.isPending}
                        onClick={() => {
                          if (window.confirm(
                            `Usunąć ${member.user.displayName} z grupy?`
                          )) {
                            void run(() =>
                              groupsApi.removeMember(
                                id,
                                member.userId,
                              )
                            )
                          }
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-danger/10 text-xs text-left text-danger"
                      >
                        <UserMinus size={15} />
                        Usuń z grupy
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

        </section>

        <section className="border-t border-border p-3">

          <button
            type="button"
            disabled={isOwner || !me || action.isPending}
            onClick={() => void leave()}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-danger hover:bg-danger/10 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LogOut size={18} />
            Opuść grupę
          </button>

          {isOwner && (
            <p className="text-[11px] leading-relaxed text-muted px-3 pb-3">
              Przed opuszczeniem grupy musisz przekazać
              własność innemu uczestnikowi.
            </p>
          )}

        </section>
      </div>
    </aside>
  )
}
