import { api } from './client'

export type MuteDuration = 15 | 60 | 480 | 1440 | -1

export interface ConversationSettings {
  conversationId: string
  mutedUntil: string | null
  archived: boolean
  lastReadAt: string | null
}

export const conversationSettingsApi = {
  async get(id: string) {
    const { data } = await api.get<ConversationSettings>(
      `/conversations/${id}/settings`,
    )

    return data
  },

  async mute(id: string, duration: MuteDuration) {
    const { data } = await api.patch(
      `/conversations/${id}/mute`,
      { duration },
    )

    return data
  },

  async unmute(id: string) {
    const { data } = await api.delete(
      `/conversations/${id}/mute`,
    )

    return data
  },
}
