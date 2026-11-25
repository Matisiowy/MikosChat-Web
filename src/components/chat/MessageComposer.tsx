import type { Message } from '../../types/chat'
import { messagePreview } from '../../utils/message-preview'
import { useEffect, useRef, useState } from 'react'
import {
  Send,
  LoaderCircle,
  Paperclip,
  Reply,
  ImagePlus,
  X,
} from 'lucide-react'

import { socket } from '../../api/socket'
import { uuid } from '../../utils/uuid'
import { getApiError } from '../../api/client'

import {
  validateFiles,
  formatFileSize,
} from '../../utils/files'

import AttachmentPreview from './attachments/AttachmentPreview'

interface Props {
  conversationId: string
  replyTo: Message | null
  onCancelReply: () => void

  onSend: (
    content: string,
    clientMessageId: string,
    replyToId?: string,
  ) => Promise<void>

  onSendAttachments: (
    content: string,
    clientMessageId: string,
    files: File[],
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ) => Promise<void>
}

export default function MessageComposer({
  conversationId,
  replyTo,
  onCancelReply,
  onSend,
  onSendAttachments,
}: Props) {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTyping = useRef(0)
  const pendingId = useRef<string | null>(null)

  const input = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)

  const controller = useRef<AbortController | null>(null)
  const busy = useRef(false)

  const totalSize = files.reduce(
    (sum, file) => sum + file.size,
    0,
  )

  function stopTyping() {
    if (timer.current) clearTimeout(timer.current)

    if (socket.connected) {
      socket.emit('typing:stop', { conversationId })
    }
  }

  useEffect(() => {
    return () => {
      controller.current?.abort()

      if (timer.current) clearTimeout(timer.current)

      if (socket.connected) {
        socket.emit('typing:stop', { conversationId })
      }
    }
  }, [conversationId])

  useEffect(() => {
    pendingId.current = null

    if (replyTo) {
      input.current?.focus()
    }
  }, [replyTo?.id])

  function change(value: string) {
    setContent(value)
    pendingId.current = null

    if (!value.trim()) {
      stopTyping()
      return
    }

    const now = Date.now()

    if (
      socket.connected &&
      now - lastTyping.current > 1500
    ) {
      socket.emit('typing:start', { conversationId })
      lastTyping.current = now
    }

    if (timer.current) clearTimeout(timer.current)

    timer.current = setTimeout(stopTyping, 2000)
  }

  function addFiles(selected: File[]) {
    if (busy.current || !selected.length) return

    if (replyTo) {
      setError('Anuluj odpowiedź przed dodaniem plików.')
      return
    }

    const next = [...files, ...selected]
    const validation = validateFiles(next)

    if (validation) {
      setError(validation)
      return
    }

    setFiles(next)
    setError('')
    pendingId.current = null
  }

  function removeFile(index: number) {
    if (busy.current) return

    setFiles(current =>
      current.filter((_, i) => i !== index),
    )

    pendingId.current = null
    setError('')
  }

  async function submit() {
    const text = content.trim()

    if ((!text && !files.length) || busy.current) {
      return
    }

    if (replyTo && files.length) {
      setError('Usuń pliki lub anuluj odpowiedź.')
      return
    }

    const validation = validateFiles(files)

    if (validation) {
      setError(validation)
      return
    }

    busy.current = true
    setSending(true)
    setProgress(0)
    setError('')
    stopTyping()

    pendingId.current ??= uuid()

    const abort = new AbortController()
    controller.current = abort

    try {
      if (files.length) {
        await onSendAttachments(
          text,
          pendingId.current,
          files,
          setProgress,
          abort.signal,
        )
      } else {
        await onSend(text, pendingId.current, replyTo?.id)
      }

      onCancelReply()
      setContent('')
      setFiles([])
      pendingId.current = null
    } catch (error) {
      setError(
        abort.signal.aborted
          ? 'Przerwano przesyłanie. Sprawdź rozmowę przed ponowieniem.'
          : getApiError(error),
      )
    } finally {
      controller.current = null
      busy.current = false
      setSending(false)
      setProgress(0)
      input.current?.focus()
    }
  }

  return (
    <div
      onDragOver={event => {
        if (!event.dataTransfer.types.includes('Files')) return

        event.preventDefault()

        if (!sending) setDragging(true)
      }}
      onDragLeave={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setDragging(false)
        }
      }}
      onDrop={event => {
        event.preventDefault()
        setDragging(false)

        addFiles(Array.from(event.dataTransfer.files))
      }}
      className={`relative p-4 border-t bg-background ${
        dragging
          ? 'border-primary ring-2 ring-inset ring-primary'
          : 'border-border'
      }`}
    >
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={event => {
          addFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />

      <input
        ref={imageInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={event => {
          addFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />

      {replyTo && (
        <div className="flex items-center gap-3 mb-3 bg-surface rounded-xl p-3 border-l-2 border-primary">
          <Reply
            size={20}
            className="text-primary-hover shrink-0"
          />

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary-hover">
              Odpowiadasz: {replyTo.sender.displayName}
            </p>

            <p className="text-xs text-muted truncate mt-1">
              {messagePreview(replyTo)}
            </p>
          </div>

          <button
            type="button"
            title="Anuluj odpowiedź"
            disabled={sending}
            onClick={onCancelReply}
            className="text-muted hover:text-white disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 bg-primary/20 border-2 border-dashed border-primary rounded-xl flex items-center justify-center">
          <span className="bg-sidebar px-4 py-2 rounded-xl text-sm">
            Upuść pliki tutaj
          </span>
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {files.map((file, index) => (
              <AttachmentPreview
                key={`${file.name}-${file.lastModified}-${index}`}
                file={file}
                disabled={sending}
                onRemove={() => removeFile(index)}
              />
            ))}
          </div>

          <div className="flex justify-between text-[11px] text-muted">
            <span>{files.length}/5 plików</span>
            <span>{formatFileSize(totalSize)} / 100 MB</span>
          </div>
        </div>
      )}

      {sending && files.length > 0 && (
        <div className="mb-3 bg-surface rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs mb-2">
            <LoaderCircle size={14} className="animate-spin" />

            <span className="flex-1">
              {progress === 100
                ? 'Przetwarzanie plików...'
                : `Przesyłanie... ${progress}%`}
            </span>

            <button
              type="button"
              title="Anuluj przesyłanie"
              onClick={() => controller.current?.abort()}
              className="hover:text-danger"
            >
              <X size={16} />
            </button>
          </div>

          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger mb-3">
          {error}
        </p>
      )}

      <form
        onSubmit={event => {
          event.preventDefault()
          void submit()
        }}
        className="flex items-end gap-2"
      >
        <button
          type="button"
          disabled={sending}
          title="Dodaj pliki"
          onClick={() => fileInput.current?.click()}
          className="w-10 h-12 shrink-0 flex items-center justify-center text-primary-hover hover:text-white disabled:opacity-40"
        >
          <Paperclip size={23} />
        </button>

        <button
          type="button"
          disabled={sending}
          title="Dodaj zdjęcia"
          onClick={() => imageInput.current?.click()}
          className="w-10 h-12 shrink-0 flex items-center justify-center text-primary-hover hover:text-white disabled:opacity-40"
        >
          <ImagePlus size={23} />
        </button>

        <textarea
          ref={input}
          value={content}
          disabled={sending}
          onChange={event => change(event.target.value)}
          onKeyDown={event => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              void submit()
            }
          }}
          placeholder={
            files.length
              ? 'Dodaj podpis...'
              : 'Napisz wiadomość...'
          }
          maxLength={4000}
          rows={2}
          className="flex-1 min-w-0 bg-surface rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:ring-1 focus:ring-primary"
        />

        <button
          type="submit"
          disabled={
            sending || (!content.trim() && !files.length)
          }
          title="Wyślij wiadomość"
          className="w-12 h-12 shrink-0 rounded-2xl bg-primary hover:bg-primary-hover flex items-center justify-center disabled:opacity-40"
        >
          {sending
            ? <LoaderCircle size={21} className="animate-spin" />
            : <Send size={21} />}
        </button>
      </form>
    </div>
  )
}
