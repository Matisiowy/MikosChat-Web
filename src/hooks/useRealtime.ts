import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socket } from '../api/socket'
import { getMe } from '../api/auth'
import { useAuthStore } from '../stores/auth.store'
import { useRealtimeStore } from '../stores/realtime.store'

import type { TypingStatus } from '../stores/realtime.store'

export function useRealtime() {
  const token = useAuthStore(state => state.accessToken)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return

    let active = true

    const store = useRealtimeStore.getState()

    function refreshMessages() {
      void queryClient.invalidateQueries({
        queryKey: ['messages'],
      })

      void queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })
    }

    function onGroupChanged(payload: {
      conversationId: string
    }) {
      void queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })

      void queryClient.invalidateQueries({
        queryKey: ['conversation', payload.conversationId],
      })

      void queryClient.invalidateQueries({
        queryKey: ['messages', payload.conversationId],
      })
    }

    function onGroupRemoved(payload: {
      conversationId: string
    }) {
      const id = payload.conversationId

      void queryClient.cancelQueries({
        queryKey: ['conversation', id],
      })

      void queryClient.cancelQueries({
        queryKey: ['messages', id],
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
    }

    function onMuteChanged(payload: {
      conversationId: string
      mutedUntil: string | null
    }) {
      void queryClient.invalidateQueries({
        queryKey: [
          'conversation-settings',
          payload.conversationId,
        ],
      })
    }

    function refreshPresence() {
      void queryClient.invalidateQueries({
        queryKey: ['presence'],
      })
    }

    function onConnect() {
      store.setConnected(true)
      refreshMessages()
      refreshPresence()

      void queryClient.invalidateQueries({
        queryKey: ['conversation-settings'],
      })

      void queryClient.invalidateQueries({
        queryKey: ['conversation'],
      })

      void queryClient.invalidateQueries({
        queryKey: ['friends'],
      })
    }

    async function onDisconnect(reason: string) {
      store.setConnected(false)

      if (reason === 'io server disconnect' && active) {
        try {
          await getMe()

          if (
            active &&
            useAuthStore.getState().accessToken === token
          ) {
            socket.connect()
          }
        } catch {
          // Sesja wygasła lub została unieważniona.
        }
      }
    }

    function onTyping(status: TypingStatus) {
      store.updateTyping(status)
    }

    function onError() {
      store.setConnected(false)
    }

    socket.auth = { token }

    socket.on('session:ready', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onError)

    socket.on('message:new', refreshMessages)
    socket.on('message:updated', refreshMessages)
    socket.on('message:deleted', refreshMessages)
    socket.on('receipt:update', refreshMessages)
    socket.on('reaction:update', refreshMessages)
    socket.on('presence:update', refreshPresence)
    socket.on('typing:update', onTyping)

    socket.on('conversation:created', onGroupChanged)
    socket.on('conversation:updated', onGroupChanged)
    socket.on('conversation:added', onGroupChanged)
    socket.on('conversation:removed', onGroupRemoved)
    socket.on('conversation:mute', onMuteChanged)


    socket.connect()

    const timer = window.setInterval(() => {
      store.clearExpired()
    }, 1000)

    return () => {
      active = false
      window.clearInterval(timer)

      socket.off('session:ready', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onError)

      socket.off('message:new', refreshMessages)
      socket.off('message:updated', refreshMessages)
      socket.off('message:deleted', refreshMessages)
      socket.off('receipt:update', refreshMessages)
      socket.off('reaction:update', refreshMessages)
      socket.off('presence:update', refreshPresence)
      socket.off('typing:update', onTyping)

      socket.off('conversation:created', onGroupChanged)
      socket.off('conversation:updated', onGroupChanged)
      socket.off('conversation:added', onGroupChanged)
      socket.off('conversation:removed', onGroupRemoved)
      socket.off('conversation:mute', onMuteChanged)


      socket.disconnect()
      store.reset()
    }
  }, [token, queryClient])
}
