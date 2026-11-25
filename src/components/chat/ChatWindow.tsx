import type { Message } from '../../types/chat'
import { useEffect, useRef, useState } from 'react'
import {
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { LoaderCircle, MessageCircle } from 'lucide-react'

import { chatApi } from '../../api/chat'
import { attachmentApi } from '../../api/attachments'
import { getApiError } from '../../api/client'
import { useAuthStore } from '../../stores/auth.store'
import { useRealtimeStore } from '../../stores/realtime.store'

import MessageBubble from './MessageBubble'
import MessageComposer from './MessageComposer'

interface Props {
  conversationId: string
}

export default function ChatWindow({
  conversationId,
}: Props) {
  const userId = useAuthStore(state => state.user!.id)
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  useEffect(() => {
    setReplyTo(null)
  }, [conversationId])

  const bottom = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const confirmed = useRef(new Set<string>())
  const nearBottom = useRef(true)

  const connected = useRealtimeStore(state => state.connected)
  const typing = useRealtimeStore(state => state.typing)

  const isTyping = typing.some(item =>
    item.conversationId === conversationId &&
    item.userId !== userId
  )

  const history = useInfiniteQuery({
    queryKey: ['messages', conversationId],

    queryFn: ({ pageParam }) =>
      chatApi.messages(conversationId, pageParam),

    initialPageParam: undefined as string | undefined,

    getNextPageParam: page =>
      page.hasMore
        ? page.nextCursor ?? undefined
        : undefined,

    refetchInterval: connected ? false : 10000,
  })

  const messages = Array.from(
    new Map(
      (history.data?.pages ?? [])
        .slice()
        .reverse()
        .flatMap(page => page.items)
        .map(message => [message.id, message])
    ).values()
  )

  const lastId = messages.at(-1)?.id

  useEffect(() => {
    if (nearBottom.current) {
      bottom.current?.scrollIntoView({
        behavior: 'instant',
      })
    }
  }, [lastId])

  useEffect(() => {
    const data = history.data

    if (!data) return

    let cancelled = false

    async function confirmReads() {
      if (document.visibilityState !== 'visible') return

      const pending = data!.pages
        .flatMap(page => page.items)
        .filter(message =>
          message.type !== 'SYSTEM' &&
          message.senderId !== userId &&
          !message.deletedAt &&
          message.receipts?.some(receipt =>
            receipt.userId === userId && !receipt.readAt
          )
        )

      for (const message of pending.slice(0, 20)) {
        if (cancelled) break
        if (confirmed.current.has(message.id)) continue

        confirmed.current.add(message.id)

        try {
          await chatApi.read(message.id)
        } catch {
          confirmed.current.delete(message.id)
          break
        }
      }
    }

    void confirmReads()

    document.addEventListener(
      'visibilitychange',
      confirmReads,
    )

    return () => {
      cancelled = true

      document.removeEventListener(
        'visibilitychange',
        confirmReads,
      )
    }
  }, [history.data, userId])

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['messages', conversationId],
      }),
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      }),
    ])
  }

  async function perform(action: () => Promise<unknown>) {
    setError('')

    try {
      await action()
      await refresh()
    } catch (error) {
      setError(getApiError(error))
    }
  }

  async function send(
    content: string,
    clientMessageId: string,
    replyToId?: string,
  ) {
    setError('')

    try {
      await chatApi.sendMessage(
        conversationId,
        content,
        clientMessageId,
        replyToId,
      )

      nearBottom.current = true
      await refresh()

      bottom.current?.scrollIntoView({
        behavior: 'smooth',
      })
    } catch (error) {
      setError(getApiError(error))
      throw error
    }
  }

  async function sendAttachments(
    content: string,
    clientMessageId: string,
    files: File[],
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ) {
    setError('')

    await attachmentApi.send(
      conversationId,
      content,
      clientMessageId,
      files,
      onProgress,
      signal,
    )

    nearBottom.current = true

    await refresh()

    bottom.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  function jumpToMessage(id: string) {
    const element = document.getElementById(`message-${id}`)

    if (!element) {
      setError('Wczytaj starsze wiadomości, aby zobaczyć cytowaną wiadomość.')
      return
    }

    setError('')
    nearBottom.current = false

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    element.classList.add('bg-primary/20')

    window.setTimeout(() => {
      element.classList.remove('bg-primary/20')
    }, 1800)
  }

  async function loadOlder() {
    const element = viewport.current

    if (!element) return

    const previousHeight = element.scrollHeight
    const previousTop = element.scrollTop

    nearBottom.current = false

    await history.fetchNextPage()

    requestAnimationFrame(() => {
      element.scrollTop =
        previousTop + element.scrollHeight - previousHeight
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {!connected && (
        <div className="text-xs text-amber-400 bg-amber-500/10 text-center py-2">
          Łączenie z serwerem komunikacji na żywo...
        </div>
      )}

      <div
        ref={viewport}
        onScroll={e => {
          const el = e.currentTarget

          nearBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 120
        }}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6"
      >
        <div className="flex flex-col gap-2 min-h-full">

          {history.hasNextPage && (
            <button
              disabled={history.isFetchingNextPage}
              onClick={() => void loadOlder()}
              className="text-primary-hover text-xs mx-auto p-3"
            >
              {history.isFetchingNextPage
                ? 'Ładowanie...'
                : 'Pokaż starsze wiadomości'}
            </button>
          )}

          {history.isPending && (
            <LoaderCircle className="animate-spin text-primary mx-auto mt-10" />
          )}

          {history.isError && (
            <div className="text-center text-danger text-sm mt-10">
              Nie udało się pobrać wiadomości.

              <button
                onClick={() => void history.refetch()}
                className="block mx-auto text-primary-hover mt-2"
              >
                Spróbuj ponownie
              </button>
            </div>
          )}

          {history.isSuccess && messages.length === 0 && (
            <div className="m-auto text-center text-muted py-10">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>To początek Waszej rozmowy.</p>
              <p className="text-xs mt-2">
                Napisz pierwszą wiadomość!
              </p>
            </div>
          )}

          {messages.length > 0 && (
            <div className="flex-1" />
          )}

          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              userId={userId}
              onReply={setReplyTo}
              onJumpToMessage={jumpToMessage}
              onEdit={(id, content) =>
                void perform(() => chatApi.editMessage(id, content))
              }
              onDelete={id =>
                void perform(() => chatApi.deleteMessage(id))
              }
              onReact={(id, emoji) =>
                void perform(() => chatApi.react(id, emoji))
              }
              onRemoveReaction={id =>
                void perform(() => chatApi.removeReaction(id))
              }
            />
          ))}

          <div ref={bottom} />
        </div>
      </div>

      {isTyping && (
        <div className="flex items-center gap-3 px-5 py-2">
          <div className="flex items-center gap-1 bg-surface rounded-full px-3 py-2">
            {[0, 1, 2].map(index => (
              <span
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                style={{ animationDelay: `${index * 150}ms` }}
              />
            ))}
          </div>

          <span className="text-xs text-muted">
            Ktoś pisze...
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="text-danger text-xs px-5 py-2"
        >
          {error}
        </div>
      )}

      <MessageComposer
        key={conversationId}
        conversationId={conversationId}
        replyTo={
          replyTo?.conversationId === conversationId
            ? replyTo
            : null
        }
        onCancelReply={() => setReplyTo(null)}
        onSend={send}
        onSendAttachments={sendAttachments}
      />
    </div>
  )
}
