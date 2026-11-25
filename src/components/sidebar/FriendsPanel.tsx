import { useState } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import {
  Search,
  UserPlus,
  MessageCircle,
  Check,
  X,
  UsersRound,
} from 'lucide-react'

import { chatApi } from '../../api/chat'
import { getApiError } from '../../api/client'
import Avatar from '../common/Avatar'

interface Props {
  discover: boolean
  onConversation: (id: string) => void
}

export default function FriendsPanel({
  discover,
  onConversation,
}: Props) {
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const friends = useQuery({
    queryKey: ['friends'],
    queryFn: chatApi.friends,
  })

  const requests = useQuery({
    queryKey: ['friend-requests'],
    queryFn: chatApi.requests,
    refetchInterval: 15000,
  })

  const users = useQuery({
    queryKey: ['user-search', search.trim()],
    queryFn: () => chatApi.searchUsers(search.trim()),
    enabled: discover && search.trim().length >= 2,
  })

  const presence = useQuery({
    queryKey: ['presence'],
    queryFn: chatApi.presence,
    refetchInterval: 30000,
  })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['friends'] }),
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      queryClient.invalidateQueries({ queryKey: ['presence'] }),
    ])
  }

  const action = useMutation({
    mutationFn: async (input: {
      type: 'add' | 'accept' | 'reject' | 'chat'
      id: string
    }) => {
      setError('')

      switch (input.type) {
        case 'add':
          await chatApi.addFriend(input.id)
          break

        case 'accept':
          await chatApi.acceptFriend(input.id)
          break

        case 'reject':
          await chatApi.rejectFriend(input.id)
          break

        case 'chat': {
          const conversation = await chatApi.createDirect(input.id)
          onConversation(conversation.id)
          break
        }
      }
    },
    onSuccess: refresh,
    onError: error => setError(getApiError(error)),
  })

  return (
    <div className="h-full flex flex-col min-h-0">

      <div className="p-5">
        <h1 className="text-2xl font-bold mb-5">
          {discover ? 'Odkrywaj' : 'Znajomi'}
        </h1>

        <div className="relative">
          <Search size={17} className="absolute left-3 top-3 text-muted" />

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={discover ? 'Znajdź użytkownika' : 'Szukaj znajomych'}
            className="w-full bg-surface rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && (
          <p role="alert" className="text-danger text-xs mt-3">
            {error}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3">

        {(friends.isError || requests.isError || users.isError) && (
          <p className="text-danger text-sm p-3">
            Nie udało się pobrać danych.
          </p>
        )}

        {discover ? (
          <>
            {search.trim().length < 2 && (
              <p className="text-muted text-sm text-center mt-8">
                Wpisz minimum 2 znaki.
              </p>
            )}

            {users.isFetching && (
              <p className="text-muted text-sm p-3">Wyszukiwanie...</p>
            )}

            {users.data?.map(user => {
              const isFriend = friends.data?.some(
                f => f.user.id === user.id
              )

              const pending =
                requests.data?.outgoing.some(
                  r => r.receiver?.id === user.id
                ) ||
                requests.data?.incoming.some(
                  r => r.sender?.id === user.id
                )

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface"
                >
                  <Avatar name={user.displayName} url={user.avatarUrl} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-muted truncate">
                      @{user.username}
                    </p>
                  </div>

                  <button
                    disabled={action.isPending || pending}
                    title={isFriend ? 'Napisz wiadomość' : 'Dodaj znajomego'}
                    onClick={() => action.mutate({
                      type: isFriend ? 'chat' : 'add',
                      id: user.id,
                    })}
                    className="w-9 h-9 rounded-xl bg-primary/15 text-primary-hover flex items-center justify-center"
                  >
                    {isFriend
                      ? <MessageCircle size={18} />
                      : pending
                        ? <Check size={18} />
                        : <UserPlus size={18} />}
                  </button>
                </div>
              )
            })}
          </>
        ) : (
          <>
            {!!requests.data?.incoming.length && (
              <>
                <h2 className="text-xs font-semibold text-muted uppercase p-3">
                  Zaproszenia
                </h2>

                {requests.data.incoming.map(request => (
                  <div key={request.id} className="flex items-center gap-2 p-3">
                    <Avatar name={request.sender?.displayName || '?'} size={38} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {request.sender?.displayName}
                      </p>
                    </div>

                    <button
                      disabled={action.isPending}
                      title="Akceptuj"
                      onClick={() => action.mutate({
                        type: 'accept',
                        id: request.id,
                      })}
                      className="text-online p-2"
                    >
                      <Check size={18} />
                    </button>

                    <button
                      disabled={action.isPending}
                      title="Odrzuć"
                      onClick={() => action.mutate({
                        type: 'reject',
                        id: request.id,
                      })}
                      className="text-danger p-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </>
            )}

            <h2 className="text-xs font-semibold text-muted uppercase p-3">
              Wszyscy znajomi — {friends.data?.length ?? 0}
            </h2>

            {friends.isSuccess && friends.data.length === 0 && (
              <div className="text-center text-muted py-10">
                <UsersRound size={34} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nie masz jeszcze znajomych.</p>
              </div>
            )}

            {friends.data?.filter(friend =>
              friend.user.displayName.toLowerCase()
                .includes(search.toLowerCase())
            ).map(friend => (
              <button
                key={friend.id}
                disabled={action.isPending}
                onClick={() => action.mutate({
                  type: 'chat',
                  id: friend.user.id,
                })}
                className="w-full flex items-center gap-3 p-3 hover:bg-surface rounded-xl text-left"
              >
                <Avatar
                  name={friend.user.displayName}
                  url={friend.user.avatarUrl}
                  online={presence.data?.some(
                    p => p.userId === friend.user.id && p.online
                  )}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {friend.user.displayName}
                  </p>

                  <p className="text-xs text-muted truncate">
                    @{friend.user.username}
                  </p>
                </div>

                <MessageCircle size={18} className="text-muted" />
              </button>
            ))}
          </>
        )}

      </div>
    </div>
  )
}
