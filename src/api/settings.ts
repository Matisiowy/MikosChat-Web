import { api } from './client'
import { getMe } from './auth'
import type { PublicUser } from '../types/chat'

export interface ProfileUpdate {
  displayName: string
  bio: string
}

export interface BlockedUser {
  id: string
  blockedId: string
  createdAt: string
  blocked: PublicUser
}

export const settingsApi = {
  async uploadAvatar(file: File) {
    const form = new FormData()
    form.append('file', file)

    await api.post('/users/me/avatar', form, {
      timeout: 30000,
    })

    return getMe()
  },

  async removeAvatar() {
    await api.delete('/users/me/avatar')
    return getMe()
  },

  async updateProfile(input: ProfileUpdate) {
    await api.patch('/users/me', input)
    return getMe()
  },

  async blockedUsers() {
    const { data } = await api.get<BlockedUser[]>('/blocks')
    return data
  },

  async unblock(userId: string) {
    await api.delete(`/blocks/${userId}`)
  },
}
