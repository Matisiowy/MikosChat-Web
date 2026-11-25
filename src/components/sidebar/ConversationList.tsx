import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  SquarePen,
  UsersRound,
  MessageCircle,
  LoaderCircle,
} from 'lucide-react'

import { chatApi } from '../../api/chat'
import { useAuthStore } from '../../stores/auth.store'
import Avatar from '../common/Avatar'

import {
  conversationName,
  conversationAvatar,
  formatTime,
} from '../../utils/conversation'

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onNewGroup: () => void
}

export default function ConversationList({
  selectedId,
  onSelect,
  onNewChat,
  onNewGroup,
}: Props) {
  const userId = useAuthStore(state => state.user!.id)
  const [search, setSearch] = useState('')

  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.conversations,
  })

  const presence = useQuery({
    queryKey: ['presence'],
    queryFn: chatApi.presence,
    refetchInterval: 30000,
  })

  const filtered = (conversations.data ?? []).filter(
    conversation => conversationName(conversation, userId)
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full min-h-0">

      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold">Rozmowy</h1>

          <div className="flex items-center gap-2">
            <button
              title="Utwórz grupę"
              aria-label="Utwórz grupę"
              onClick={onNewGroup}
              className="w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center"
            >
              <UsersRound size={18} />
            </button>

            <button
              title="Nowa rozmowa"
              aria-label="Nowa rozmowa"
              onClick={onNewChat}
              className="w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover flex items-center justify-center"
            >
              <SquarePen size={18} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search size={17} className="absolute left-3 top-3 text-muted" />

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj rozmów"
            className="w-full bg-surface rounded-xl py-2.5 pl-10 pr-3 outline-none focus:ring-1 focus:ring-primary text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">

        {conversations.isPending && (
          <LoaderCircle className="animate-spin mx-auto mt-10 text-primary" />
        )}

        {conversations.isError && (
          <div className="p-4 text-sm text-danger">
            Nie udało się pobrać rozmów.
            <button
              onClick={() => void conversations.refetch()}
              className="block mt-2 text-primary-hover"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

        {conversations.isSuccess && filtered.length === 0 && (
          <div className="text-center py-12 px-5 text-muted">
            <MessageCircle size={36} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Brak rozmów</p>

            <button
              onClick={onNewChat}
              className="text-primary-hover text-sm mt-3 hover:underline"
            >
              Rozpocznij rozmowę
            </button>
          </div>
        )}

        {filtered.map(conversation => {
          const name = conversationName(conversation, userId)
          const last = conversation.messages?.[0]

          let preview = 'Rozpocznij rozmowę'

          if (last) {
            if (last.deletedAt) {
              preview = 'Wiadomość usunięta'
            } else if (last.content?.trim()) {
              preview = last.content
            } else {
              switch (last.type) {
                case 'IMAGE':
                  preview = '📷 Zdjęcie'
                  break
                case 'VIDEO':
                  preview = '🎬 Film'
                  break
                case 'AUDIO':
                  preview = '🎵 Nagranie audio'
                  break
                case 'FILE':
                  preview = '📎 Załącznik'
                  break
                case 'SYSTEM':
                  preview = 'Wiadomość systemowa'
                  break
                default:
                  preview = 'Wiadomość'
              }
            }

            if (
              last.senderId === userId &&
              !last.deletedAt &&
              last.type !== 'SYSTEM'
            ) {
              preview = `Ty: ${preview}`
            }
          }

          const other = conversation.members.find(
            member => member.userId !== userId
          )

          const online =
            conversation.type === 'DIRECT' &&
            presence.data?.some(
              p => p.userId === other?.userId && p.online
            )

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left mb-1 transition-colors ${
                selectedId === conversation.id
                  ? 'bg-primary/15'
                  : 'hover:bg-surface'
              }`}
            >
              <Avatar
                name={name}
                url={conversationAvatar(conversation, userId)}
                online={online}
                size={46}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">
                    {name}
                  </span>

                  <span className="text-[10px] text-muted shrink-0">
                    {formatTime(conversation.updatedAt)}
                  </span>
                </div>

                <p className="text-xs text-muted truncate mt-1">
                  {preview}
                </p>
              </div>
            </button>
          )
        })}

      </div>
    </div>
  )
}
