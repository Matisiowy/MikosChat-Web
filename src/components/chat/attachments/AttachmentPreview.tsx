import { useEffect, useState } from 'react'
import {
  File,
  FileVideo,
  FileAudio,
  FileImage,
  X,
} from 'lucide-react'

import { formatFileSize } from '../../../utils/files'

interface Props {
  file: File
  disabled?: boolean
  onRemove: () => void
}

export default function AttachmentPreview({
  file,
  disabled,
  onRemove,
}: Props) {
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  const Icon = file.type.startsWith('video/')
    ? FileVideo
    : file.type.startsWith('audio/')
      ? FileAudio
      : file.type.startsWith('image/')
        ? FileImage
        : File

  return (
    <div className="relative w-28 shrink-0 bg-surface border border-border rounded-xl overflow-hidden">
      <div className="h-20 flex items-center justify-center bg-background">
        {preview ? (
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon size={32} className="text-primary-hover" />
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label="Usuń załącznik"
        className="absolute top-1 right-1 bg-black/70 rounded-full p-1 hover:bg-danger"
      >
        <X size={14} />
      </button>

      <div className="p-2">
        <p className="text-xs truncate" title={file.name}>
          {file.name}
        </p>

        <p className="text-[10px] text-muted">
          {formatFileSize(file.size)}
        </p>
      </div>
    </div>
  )
}
