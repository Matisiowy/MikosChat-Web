import { create } from 'zustand'

export interface TypingStatus {
  conversationId: string
  userId: string
  isTyping: boolean
  expiresAt: string
}

interface RealtimeState {
  connected: boolean
  typing: TypingStatus[]

  setConnected: (connected: boolean) => void
  updateTyping: (status: TypingStatus) => void
  clearExpired: () => void
  reset: () => void
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connected: false,
  typing: [],

  setConnected: connected => set({ connected }),

  updateTyping: status => set(state => {
    const remaining = state.typing.filter(item =>
      item.conversationId !== status.conversationId ||
      item.userId !== status.userId
    )

    return {
      typing: status.isTyping
        ? [...remaining, status]
        : remaining,
    }
  }),

  clearExpired: () => set(state => ({
    typing: state.typing.filter(item =>
      new Date(item.expiresAt).getTime() > Date.now()
    ),
  })),

  reset: () => set({
    connected: false,
    typing: [],
  }),
}))
