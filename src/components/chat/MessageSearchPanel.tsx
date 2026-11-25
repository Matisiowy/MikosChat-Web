import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  X,
  LoaderCircle,
  MessageSquare,
} from 'lucide-react'

import { chatApi } from '../../api/chat'
import { getApiError } from '../../api/client'
import Avatar from '../common/Avatar'

interface Props {
  conversationId: string
  userId: string
  onClose: () => void
}

export default function MessageSearchPanel({
  conversationId,
  userId,
  onClose,
}: Props) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(30)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(input.trim())
      setLimit(30)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [input])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)

    return () =>
      window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const searching = input.trim() !== query

  const results = useQuery({
    queryKey: [
      'message-search',
      userId,
      conversationId,
      query,
      limit,
    ],

    queryFn: ({ signal }) =>
      chatApi.searchMessages(
        conversationId,
        query,
        limit,
        signal,
      ),

    enabled: query.length > 0 && !searching,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
  })

  const items = results.data?.items ?? []

  return (
    <aside
      aria-label="Wyszukiwanie wiadomości"
      className="fixed inset-y-0 right-0 z-40 flex w-full sm:w-[360px] xl:static xl:z-auto shrink-0 flex-col bg-sidebar border-l border-border min-h-0"
    >
      <header className="h-[72px] shrink-0 flex items-center gap-3 px-5 border-b border-border">
        <Search size={20} className="text-primary-hover" />

        <h2 className="font-semibold flex-1">
          Wyszukaj w rozmowie
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij wyszukiwanie"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-muted hover:bg-surface"
        >
          <X size={21} />
        </button>
      </header>

      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 bg-surface rounded-xl px-3 py-3">
          <Search size={18} className="text-muted shrink-0" />

          <input
            autoFocus
            value={input}
            maxLength={200}
            onChange={event => setInput(event.target.value)}
            placeholder="Szukaj wiadomości..."
            aria-label="Treść wyszukiwanej wiadomości"
            className="bg-transparent outline-none text-sm flex-1 min-w-0"
          />

          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              aria-label="Wyczyść wyszukiwanie"
              className="text-muted hover:text-white"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      <div
        aria-live="polite"
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {!input.trim() ? (
          <div className="text-center text-muted p-8">
            <MessageSquare
              size={40}
              className="mx-auto mb-4 opacity-40"
            />
            <p className="text-sm">
              Znajdź wiadomości w tej rozmowie.
            </p>
          </div>
        ) : searching || results.isFetching ? (
          <LoaderCircle
            size={24}
            className="animate-spin text-primary mx-auto mt-10"
          />
        ) : results.isError ? (
          <div className="p-5 text-center">
            <p className="text-danger text-sm">
              {getApiError(results.error)}
            </p>

            <button
              type="button"
              onClick={() => void results.refetch()}
              className="text-primary-hover text-sm mt-3"
            >
              Spróbuj ponownie
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted p-8">
            <Search size={36} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Nie znaleziono wiadomości.</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 text-xs text-muted">
              Wyniki: {items.length}
              {results.data?.hasMore ? '+' : ''}
            </div>

            {items.map(message => (
              <article
                key={message.id}
                className="flex gap-3 px-4 py-4 border-b border-border hover:bg-surface/50"
              >
                <Avatar
                  name={message.sender.displayName}
                  url={message.sender.avatarUrl}
                />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {message.senderId === userId
                      ? 'Ty'
                      : message.sender.displayName}
                  </div>

                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  <time
                    dateTime={message.createdAt}
                    className="block text-xs text-muted mt-2"
                  >
                    {new Date(message.createdAt).toLocaleString('pl-PL')}
                  </time>
                </div>
              </article>
            ))}

            {results.data?.hasMore && limit < 50 && (
              <button
                type="button"
                onClick={() => setLimit(50)}
                className="block mx-auto p-4 text-sm text-primary-hover"
              >
                Pokaż więcej wyników
              </button>
            )}

            {results.data?.hasMore && limit === 50 && (
              <p className="p-4 text-xs text-muted text-center">
                Zawęź wyszukiwanie, aby znaleźć starsze wiadomości.
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
