import MessageSearchPanel from '../components/chat/MessageSearchPanel'
import MuteConversation from '../components/chat/MuteConversation'
import GroupDetailsPanel from '../components/groups/GroupDetailsPanel'
import CreateGroupDialog from '../components/groups/CreateGroupDialog'
import SettingsPage from '../components/settings/SettingsPage'
import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { socket } from '../api/socket'
import { useQuery } from '@tanstack/react-query'

import {
  ArrowLeft,
  LoaderCircle,
  Wifi,
  WifiOff,
  Info,
  Search,
} from 'lucide-react'

import NavigationRail from '../components/sidebar/NavigationRail'
import type { NavigationTab } from '../components/sidebar/NavigationRail'

import ConversationList from '../components/sidebar/ConversationList'
import FriendsPanel from '../components/sidebar/FriendsPanel'
import Avatar from '../components/common/Avatar'
import ChatWindow from '../components/chat/ChatWindow'

import { chatApi } from '../api/chat'
import { useAuthStore } from '../stores/auth.store'
import { useRealtimeStore } from '../stores/realtime.store'
import { useRealtime } from '../hooks/useRealtime'

import {
  conversationName,
  conversationAvatar,
} from '../utils/conversation'

export default function HomePage() {
  useRealtime()

  const user = useAuthStore(state => state.user!)
  const connected = useRealtimeStore(state => state.connected)

  const [tab, setTab] = useState<NavigationTab>('chats')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)


  const conversation = useQuery({
    queryKey: ['conversation', selectedId],
    queryFn: () => chatApi.conversation(selectedId!),
    enabled: Boolean(selectedId),
  })

  useEffect(() => {
    function onRemoved(payload: { conversationId: string }) {
      setSelectedId(current =>
        current === payload.conversationId ? null : current
      )
    }

    socket.on('conversation:removed', onRemoved)

    return () => {
      socket.off('conversation:removed', onRemoved)
    }
  }, [])

  useEffect(() => {
    if (
      isAxiosError(conversation.error) &&
      [403, 404].includes(conversation.error.response?.status ?? 0)
    ) {
      setSelectedId(null)
    }
  }, [conversation.error])

  const presence = useQuery({
    queryKey: ['presence'],
    queryFn: chatApi.presence,
    refetchInterval: 30000,
  })

  const other = conversation.data?.members.find(
    member => member.userId !== user.id
  )

  const otherPresence = presence.data?.find(
    item => item.userId === other?.userId
  )

  const online =
    conversation.data?.type === 'DIRECT' &&
    Boolean(otherPresence?.online)

  useEffect(() => {
    setGroupDetailsOpen(false)
    setSearchOpen(false)
  }, [selectedId])

  function selectConversation(id: string) {
    setSearchOpen(false)
    setGroupDetailsOpen(false)
    setSelectedId(id)
    setTab('chats')
  }

  if (tab === 'settings') {
    return (
      <main className="flex h-dvh overflow-hidden bg-background">
        <NavigationRail
          tab={tab}
          onChange={setTab}
        />

        <SettingsPage
          onBack={() => setTab('chats')}
        />
      </main>
    )
  }

  return (
    <main className="flex h-dvh overflow-hidden bg-background">

      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} shrink-0`}>
        <NavigationRail tab={tab} onChange={setTab} />
      </div>

      <aside className={`${selectedId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[330px] min-w-0 flex-1 md:flex-none bg-sidebar border-r border-border`}>

        {tab === 'chats' ? (
          <ConversationList
            selectedId={selectedId}
            onSelect={selectConversation}
            onNewChat={() => setTab('friends')}
            onNewGroup={() => setCreateGroupOpen(true)}

          />
        ) : (
          <FriendsPanel
            key={tab}
            discover={tab === 'discover'}
            onConversation={selectConversation}
          />
        )}

      </aside>

      <section className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>

        {selectedId ? (
          <>
            <header className="h-[72px] shrink-0 border-b border-border flex items-center gap-3 px-5 bg-[#15161b]">

              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden text-muted"
                aria-label="Wróć"
              >
                <ArrowLeft size={22} />
              </button>

              {conversation.data && (
                <>
                  <Avatar
                    name={conversationName(conversation.data, user.id)}
                    url={conversationAvatar(conversation.data, user.id)}
                    online={online}
                  />

                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold truncate">
                      {conversationName(conversation.data, user.id)}
                    </h2>

                    <p className={`text-xs mt-0.5 ${
                      online ? 'text-online' : 'text-muted'
                    }`}>
                      {conversation.data.type === 'GROUP'
                        ? `${conversation.data.members.length} uczestników`
                        : online
                          ? 'Aktywny teraz'
                          : otherPresence?.lastSeenAt
                            ? `Ostatnio: ${new Date(otherPresence.lastSeenAt).toLocaleString('pl-PL')}`
                            : 'Brak informacji o aktywności'}
                    </p>
                  </div>
                </>
              )}

              <div className="ml-auto shrink-0">
                {connected ? (
                  <span title="Połączono z MikosChat">
                    <Wifi size={19} className="text-online" />
                  </span>
                ) : (
                  <span title="Brak połączenia WebSocket">
                    <WifiOff size={19} className="text-muted" />
                  </span>
                )}
              </div>

              {selectedId && conversation.data && (
                <MuteConversation
                  key={selectedId}
                  conversationId={selectedId}
                  compact
                />
              )}

              {conversation.data && (
                <button
                  type="button"
                  title="Wyszukaj w rozmowie"
                  aria-label="Wyszukaj w rozmowie"
                  aria-expanded={searchOpen}
                  onClick={() => {
                    setGroupDetailsOpen(false)
                    setSearchOpen(current => !current)
                  }}
                  className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                    searchOpen
                      ? 'bg-primary/15 text-primary-hover'
                      : 'text-muted hover:bg-surface'
                  }`}
                >
                  <Search size={21} />
                </button>
              )}

              {conversation.data?.type === 'GROUP' && (
                <button
                  type="button"
                  title="Informacje o grupie"
                  aria-label="Informacje o grupie"
                  aria-expanded={groupDetailsOpen}
                  onClick={() => {
                    setSearchOpen(false)
                    setGroupDetailsOpen(current => !current)
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    groupDetailsOpen
                      ? 'bg-primary/15 text-primary-hover'
                      : 'text-muted hover:bg-surface'
                  }`}
                >
                  <Info size={21} />
                </button>
              )}

            </header>

            {conversation.isPending ? (
              <LoaderCircle className="animate-spin text-primary m-auto" />
            ) : conversation.isError ? (
              <div className="m-auto text-danger text-sm">
                Nie udało się otworzyć rozmowy.
              </div>
            ) : (
              <ChatWindow
                key={selectedId}
                conversationId={selectedId}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div className="max-w-sm">

              <img
                src="/mikoschat.svg"
                alt="MikosChat"
                className="w-20 h-20 mx-auto mb-6"
              />

              <h2 className="text-2xl font-bold">
                Witaj w MikosChat
              </h2>

              <p className="text-muted mt-3 text-sm leading-relaxed">
                Wybierz rozmowę lub znajdź znajomych,
                aby rozpocząć konwersację.
              </p>

              <button
                onClick={() => setTab('discover')}
                className="bg-primary hover:bg-primary-hover rounded-xl px-5 py-3 mt-6 font-medium text-sm"
              >
                Znajdź znajomych
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted mt-6">
                <span className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-online' : 'bg-amber-400'
                }`} />

                {connected
                  ? 'Połączono z MikosChat'
                  : 'Łączenie z serwerem...'}
              </div>

            </div>
          </div>
        )}

      </section>

      {selectedId &&
        searchOpen &&
        conversation.data &&
        !conversation.isError && (
          <>
            <button
              type="button"
              aria-label="Zamknij panel wyszukiwania"
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 xl:hidden"
            />

            <MessageSearchPanel
              key={selectedId}
              conversationId={selectedId}
              userId={user.id}
              onClose={() => setSearchOpen(false)}
            />
          </>
        )}

      {selectedId &&
        groupDetailsOpen &&
        !conversation.isError &&
        conversation.data?.type === 'GROUP' && (
          <>
            <button
              type="button"
              aria-label="Zamknij informacje o grupie"
              onClick={() => setGroupDetailsOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 xl:hidden"
            />

            <GroupDetailsPanel
              key={selectedId}
              conversation={conversation.data}
              userId={user.id}
              onClose={() => setGroupDetailsOpen(false)}
              onLeave={() => {
                setGroupDetailsOpen(false)
                setSelectedId(current =>
                  current === selectedId ? null : current
                )
              }}
            />
          </>
        )}

      {createGroupOpen && (
        <CreateGroupDialog
          onClose={() => setCreateGroupOpen(false)}
          onCreated={id => {
            setCreateGroupOpen(false)
            selectConversation(id)
          }}
        />
      )}

    </main>
  )
}
