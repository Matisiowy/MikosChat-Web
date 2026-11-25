import type { Message } from '../../types/chat'

interface Props {
  message: Message
}

export default function SystemMessage({
  message,
}: Props) {
  return (
    <div
      className="flex justify-center px-6 py-2"
      title={new Date(message.createdAt).toLocaleString('pl-PL')}
    >
      <p className="max-w-[85%] text-center text-xs leading-relaxed text-muted break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
        {message.content}
      </p>
    </div>
  )
}
