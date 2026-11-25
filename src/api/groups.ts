import { api } from './client'

export const groupsApi = {
  async update(
    id: string,
    data: {
      name?: string
      description?: string
    },
  ) {
    const response = await api.patch(`/groups/${id}`, data)
    return response.data
  },

  async addMembers(id: string, memberIds: string[]) {
    const response = await api.post(
      `/groups/${id}/members`,
      { memberIds },
    )

    return response.data
  },

  async removeMember(id: string, userId: string) {
    const response = await api.delete(
      `/groups/${id}/members/${userId}`,
    )

    return response.data
  },

  async updateRole(
    id: string,
    userId: string,
    role: 'ADMIN' | 'MEMBER',
  ) {
    const response = await api.patch(
      `/groups/${id}/members/${userId}/role`,
      { role },
    )

    return response.data
  },

  async transferOwner(id: string, userId: string) {
    const response = await api.post(
      `/groups/${id}/transfer-owner`,
      { userId },
    )

    return response.data
  },

  async leave(id: string) {
    const response = await api.post(`/groups/${id}/leave`)
    return response.data
  },

  async uploadAvatar(id: string, file: File) {
    const form = new FormData()
    form.append('file', file)

    const { data } = await api.post<{ avatarUrl: string }>(
      `/groups/${id}/avatar`,
      form,
      { timeout: 60000 },
    )

    return data
  },

  async removeAvatar(id: string) {
    const { data } = await api.delete<{ avatarUrl: null }>(
      `/groups/${id}/avatar`,
    )

    return data
  },

  async downloadAvatar(
    url: string,
    signal?: AbortSignal,
  ): Promise<Blob> {
    const prefix = '/api/v1/media/group-avatars/'

    if (
      !url.startsWith(prefix) ||
      !/^[a-f0-9-]{36}\.webp$/.test(url.slice(prefix.length))
    ) {
      throw new Error('Invalid group avatar URL')
    }

    const { data } = await api.get<Blob>(
      url.slice('/api/v1'.length),
      {
        responseType: 'blob',
        signal,
      },
    )

    return data
  },
}
