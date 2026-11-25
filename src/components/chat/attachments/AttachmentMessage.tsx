import { useEffect, useRef, useState } from 'react'

import {
  Download,
  File,
  FileVideo,
  FileAudio,
  FileImage,
  LoaderCircle,
  Play,
  X,
} from 'lucide-react'

import { attachmentApi } from '../../../api/attachments'
import { formatFileSize, saveBlob } from '../../../utils/files'
import type { Attachment } from '../../../types/chat'

interface Props {
  attachment: Attachment
}

export default function AttachmentMessage({
  attachment,
}: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  const container = useRef<HTMLDivElement>(null)
  const controller = useRef<AbortController | null>(null)
  const objectUrl = useRef('')

  const isImage = attachment.mimeType.startsWith('image/')
  const isVideo = attachment.mimeType.startsWith('video/')
  const isAudio = attachment.mimeType.startsWith('audio/')

  const Icon = isImage
    ? FileImage
    : isVideo
      ? FileVideo
      : isAudio
        ? FileAudio
        : File

  useEffect(() => {
    const element = container.current

    if (!element || !isImage) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '150px' },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [isImage])

  useEffect(() => {
    if (!visible || !isImage) return

    const abort = new AbortController()
    let active = true

    setLoading(true)

    attachmentApi.download(
      attachment.id,
      abort.signal,
    ).then(blob => {
      if (!active) return

      objectUrl.current = URL.createObjectURL(blob)
      setUrl(objectUrl.current)
    }).catch(() => {
      if (active) {
        setError('Nie udało się załadować zdjęcia.')
      }
    }).finally(() => {
      if (active) setLoading(false)
    })

    return () => {
      active = false
      abort.abort()

      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current)
        objectUrl.current = ''
      }
    }
  }, [attachment.id, visible, isImage])

  useEffect(() => {
    return () => {
      controller.current?.abort()

      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!expanded) return

    function close(event: KeyboardEvent) {
      if (event.key === 'Escape') setExpanded(false)
    }

    window.addEventListener('keydown', close)

    return () => window.removeEventListener('keydown', close)
  }, [expanded])

  async function loadMedia() {
    if (loading || url) return

    const abort = new AbortController()
    controller.current = abort

    setLoading(true)
    setError('')

    try {
      const blob = await attachmentApi.download(
        attachment.id,
        abort.signal,
      )

      if (abort.signal.aborted) return

      objectUrl.current = URL.createObjectURL(blob)
      setUrl(objectUrl.current)
    } catch {
      if (!abort.signal.aborted) {
        setError('Nie udało się pobrać multimediów.')
      }
    } finally {
      if (!abort.signal.aborted) setLoading(false)
    }
  }

  async function download() {
    if (loading) return

    const abort = new AbortController()
    controller.current = abort

    setLoading(true)
    setError('')

    try {
      const blob = await attachmentApi.download(
        attachment.id,
        abort.signal,
      )

      if (!abort.signal.aborted) {
        saveBlob(blob, attachment.originalName)
      }
    } catch {
      if (!abort.signal.aborted) {
        setError('Nie udało się pobrać pliku.')
      }
    } finally {
      if (!abort.signal.aborted) setLoading(false)
    }
  }

  return (
    <div
      ref={container}
      className="w-[300px] max-w-full bg-surface border border-border rounded-xl overflow-hidden"
    >
      {isImage && (
        <div className="bg-background min-h-24 flex items-center justify-center">
          {url ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="block w-full cursor-zoom-in"
            >
              <img
                src={url}
                alt={attachment.originalName}
                className="w-full max-h-80 object-contain"
              />
            </button>
          ) : (
            <div className="p-6 text-muted">
              {loading
                ? <LoaderCircle className="animate-spin" />
                : <FileImage size={32} />}
            </div>
          )}
        </div>
      )}

      {isVideo && url && (
        <video
          src={url}
          controls
          playsInline
          className="w-full max-h-80 bg-black"
        />
      )}

      {isAudio && url && (
        <audio
          src={url}
          controls
          className="w-full p-2"
        />
      )}

      <div className="flex items-center gap-3 p-3">
        <div className="w-10 h-10 shrink-0 bg-primary/15 rounded-lg flex items-center justify-center">
          <Icon size={21} className="text-primary-hover" />
        </div>

        <div className="min-w-0 flex-1">
          <p
            title={attachment.originalName}
            className="text-xs font-medium truncate"
          >
            {attachment.originalName}
          </p>

          <p className="text-[10px] text-muted mt-1">
            {formatFileSize(attachment.size)}
          </p>
        </div>

        {(isVideo || isAudio) && !url && (
          <button
            disabled={loading}
            onClick={() => void loadMedia()}
            title="Odtwórz"
            className="text-primary-hover hover:text-white"
          >
            <Play size={18} />
          </button>
        )}

        <button
          disabled={loading}
          onClick={() => void download()}
          title="Pobierz plik"
          className="text-muted hover:text-primary-hover"
        >
          {loading
            ? <LoaderCircle size={18} className="animate-spin" />
            : <Download size={18} />}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-danger px-3 pb-3">
          {error}
        </p>
      )}

      {expanded && url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={attachment.originalName}
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-5"
        >
          <button
            onClick={() => setExpanded(false)}
            aria-label="Zamknij podgląd"
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20"
          >
            <X size={24} />
          </button>

          <img
            src={url}
            alt={attachment.originalName}
            onClick={event => event.stopPropagation()}
            className="max-w-full max-h-[85dvh] object-contain"
          />

          <p className="text-sm text-white/70 mt-4">
            {attachment.originalName}
          </p>
        </div>
      )}
    </div>
  )
}
