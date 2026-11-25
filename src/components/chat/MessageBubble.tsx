import { messagePreview } from '../../utils/message-preview'
import SystemMessage from './SystemMessage'
import { useState } from 'react'
import {
  Check,
  CheckCheck,
  SmilePlus,
  Reply,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

import Avatar from '../common/Avatar'
import AttachmentMessage from './attachments/AttachmentMessage'
import type { Message } from '../../types/chat'

const emojis = [
  '❤️', '😂', '😮', '😢', '😡', '👍',
  '👎', '🔥', '💀', '🎉', '😍', '🤔',
]

interface Props {
  message: Message
  userId: string
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onReact: (id: string, emoji: string) => void
  onRemoveReaction: (id: string) => void
  onReply: (message: Message) => void
  onJumpToMessage: (id: string) => void
}

export default function MessageBubble({
  message,
  userId,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
  onReply,
  onJumpToMessage,
}: Props) {
  const own = message.senderId === userId
  const deleted = Boolean(message.deletedAt)

  const [picker, setPicker] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (message.type === 'SYSTEM') {
    return <SystemMessage message={message} />
  }

  const receipts = message.receipts ?? []
  const reactions = message.reactions ?? []
  const attachments = message.attachments ?? []

  const read = receipts.length > 0 &&
    receipts.every(receipt => Boolean(receipt.readAt))

  const delivered = receipts.length > 0 &&
    receipts.every(receipt => Boolean(receipt.deliveredAt))

  const grouped = new Map<string, number>()

  for (const reaction of reactions) {
    grouped.set(
      reaction.emoji,
      (grouped.get(reaction.emoji) ?? 0) + 1,
    )
  }

  function react(emoji: string) {
    const existing = reactions.find(r =>
      r.userId === userId && r.emoji === emoji
    )

    if (existing) {
      onRemoveReaction(message.id)
    } else {
      onReact(message.id, emoji)
    }

    setPicker(false)
  }

  return (
    <div id={`message-${message.id}`} className={`group flex gap-2 items-end rounded-xl transition-colors ${
      own ? 'justify-end' : 'justify-start'
    }`}>

      {!own && (
        <Avatar
          name={message.sender.displayName}
          url={message.sender.avatarUrl}
          size={30}
        />
      )}

      <div className={`relative max-w-[85%] sm:max-w-[70%] flex flex-col ${
        own ? 'items-end' : 'items-start'
      }`}>

        {!own && (
          <span className="text-[11px] text-muted mb-1 ml-2">
            {message.sender.displayName}
          </span>
        )}

        {!deleted && message.replyTo && (
          <button
            type="button"
            onClick={() =>
              onJumpToMessage(message.replyTo!.id)
            }
            className="max-w-full mb-1 text-left"
          >
            <div className="flex items-center gap-1 text-[10px] text-muted mb-1 px-2">
              <Reply size={12} />
              Odpowiedź na wiadomość
            </div>

            <div className="bg-sidebar border-l-2 border-primary rounded-xl px-3 py-2 text-xs text-muted line-clamp-2 break-all">
              {messagePreview(message.replyTo)}
            </div>
          </button>
        )}

        {editing ? (
          <div className="bg-surface rounded-2xl p-3 w-full min-w-[200px]">
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={4000}
              className="w-full bg-background rounded-lg p-2 outline-none resize-none"
            />

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setEditing(false)}
                aria-label="Anuluj edycję"
                className="text-muted"
              >
                <X size={18} />
              </button>

              <button
                disabled={!draft.trim()}
                onClick={() => {
                  onEdit(message.id, draft.trim())
                  setEditing(false)
                }}
                aria-label="Zapisz edycję"
                className="text-online"
              >
                <Check size={18} />
              </button>
            </div>
          </div>
        ) : (deleted || message.content || attachments.length === 0) ? (
          <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
            deleted
              ? 'border border-border text-muted italic'
              : own
                ? 'bg-primary text-white rounded-br-md'
                : 'bg-surface rounded-bl-md'
          }`}>
            {deleted
              ? 'Wiadomość została usunięta'
              : message.content}
          </div>
        ) : null}

        {!deleted && attachments.length > 0 && (
          <div className="flex flex-col gap-2 mt-1 max-w-full">
            {attachments.map(attachment => (
              <AttachmentMessage
                key={attachment.id}
                attachment={attachment}
              />
            ))}
          </div>
        )}

        {!deleted && grouped.size > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Array.from(grouped.entries()).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                className="bg-sidebar border border-border rounded-full px-2 py-0.5 text-xs hover:border-primary"
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-muted">
          {message.editedAt && !deleted && 'Edytowano · '}

          {new Date(message.createdAt).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
          })}

          {own && !deleted && (
            read ? (
              <span title="Wyświetlono" className="text-primary-hover">
                <CheckCheck size={14} />
              </span>
            ) : delivered ? (
              <span title="Dostarczono">
                <CheckCheck size={14} />
              </span>
            ) : (
              <span title="Wysłano">
                <Check size={14} />
              </span>
            )
          )}
        </div>

        {!deleted && !editing && (
          <div className="absolute -top-7 flex gap-2 p-1.5 rounded-lg bg-sidebar border border-border z-10 text-muted opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">

            <button
              type="button"
              title="Odpowiedz"
              aria-label="Odpowiedz"
              onClick={() => onReply(message)}
              className="hover:text-primary-hover"
            >
              <Reply size={16} />
            </button>

            <button
              title="Dodaj reakcję"
              onClick={() => setPicker(!picker)}
              className="hover:text-primary-hover"
            >
              <SmilePlus size={16} />
            </button>

            {own && (
              <>
                {message.type === 'TEXT' && (
                <button
                  title="Edytuj wiadomość"
                  onClick={() => {
                    setDraft(message.content ?? '')
                    setEditing(true)
                  }}
                  className="hover:text-white"
                >
                  <Pencil size={15} />
                </button>
                )}

                <button
                  title="Usuń wiadomość"
                  onClick={() => {
                    if (window.confirm('Usunąć wiadomość?')) {
                      onDelete(message.id)
                    }
                  }}
                  className="hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        )}

        {picker && (
          <div className="grid grid-cols-6 gap-1 bg-sidebar border border-border rounded-xl p-2 shadow-xl mt-2">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                className="text-xl p-1 hover:bg-surface rounded-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
