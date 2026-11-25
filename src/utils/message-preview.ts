import type { ReplyMessage } from '../types/chat'

export function messagePreview(message: ReplyMessage): string {
  if (message.deletedAt) {
    return 'Wiadomość została usunięta'
  }

  if (message.content?.trim()) {
    return message.content
  }

  switch (message.type) {
    case 'IMAGE':
      return '📷 Zdjęcie'
    case 'VIDEO':
      return '🎬 Film'
    case 'AUDIO':
      return '🎵 Nagranie audio'
    case 'FILE':
      return '📎 Załącznik'
    default:
      return 'Wiadomość'
  }
}
