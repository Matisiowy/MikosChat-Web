import { api } from './client'
import type { Message } from '../types/chat'

export const attachmentApi = {
  async send(
    conversationId: string,
    content: string,
    clientMessageId: string,
    files: File[],
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ) {
    const form = new FormData()

    form.append('clientMessageId', clientMessageId)

    if (content.trim()) {
      form.append('content', content.trim())
    }

    for (const file of files) {
      form.append('files', file)
    }

    const { data } = await api.post<Message>(
      `/conversations/${conversationId}/attachments`,
      form,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000,
        signal,
        onUploadProgress: event => {
          if (event.total) {
            onProgress?.(
              Math.min(
                100,
                Math.round(event.loaded / event.total * 100),
              ),
            )
          }
        },
      },
    )

    return data
  },

  async download(id: string, signal?: AbortSignal) {
    const { data } = await api.get<Blob>(
      `/attachments/${id}/download`,
      {
        responseType: 'blob',
        timeout: 300000,
        signal,
      },
    )

    return data
  },
}
