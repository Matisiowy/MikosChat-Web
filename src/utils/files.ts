export const MAX_FILES = 5
export const MAX_FILE_SIZE = 50 * 1024 * 1024
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function validateFiles(files: File[]) {
  if (files.length > MAX_FILES) {
    return 'Możesz wysłać maksymalnie 5 plików.'
  }

  for (const file of files) {
    if (!file.size) {
      return `Plik ${file.name} jest pusty.`
    }

    if (file.size > MAX_FILE_SIZE) {
      return `Plik ${file.name} przekracza limit 50 MB.`
    }
  }

  const total = files.reduce(
    (sum, file) => sum + file.size,
    0,
  )

  if (total > MAX_TOTAL_SIZE) {
    return 'Łączny rozmiar plików przekracza 100 MB.'
  }

  return null
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    30000,
  )
}
