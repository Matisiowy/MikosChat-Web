import type { Conversation } from '../types/chat'

export function conversationName(
  conversation: Conversation,
  userId: string,
) {
  if (conversation.type === 'GROUP') {
    return conversation.name || 'Rozmowa grupowa'
  }

  return conversation.members.find(
    member => member.userId !== userId
  )?.user.displayName || 'Użytkownik'
}

export function conversationAvatar(
  conversation: Conversation,
  userId: string,
) {
  if (conversation.type === 'GROUP') {
    return conversation.avatarUrl
  }

  return conversation.members.find(
    member => member.userId !== userId
  )?.user.avatarUrl
}

export function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
  })
}
