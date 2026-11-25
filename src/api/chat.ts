import { api } from './client'

import type {
  PublicUser,
  Friend,
  FriendRequests,
  Conversation,
  Message,
  MessageHistory,
  Presence,
} from '../types/chat'

export const chatApi = {
  async conversations() {
    const { data } = await api.get<Conversation[]>('/conversations')
    return data
  },

  async conversation(id: string) {
    const { data } = await api.get<Conversation>(
      `/conversations/${id}`
    )
    return data
  },

  async createDirect(userId: string) {
    const { data } = await api.post<Conversation>(
      '/conversations/direct',
      { userId }
    )
    return data
  },

  async createGroup(name: string, memberIds: string[]) {
    const { data } = await api.post<Conversation>(
      '/conversations/group',
      { name, memberIds }
    )
    return data
  },

  async friends() {
    const { data } = await api.get<Friend[]>('/friends')
    return data
  },

  async requests() {
    const { data } = await api.get<FriendRequests>(
      '/friends/requests'
    )
    return data
  },

  async searchUsers(q: string) {
    const { data } = await api.get<PublicUser[]>(
      '/users/search',
      { params: { q } }
    )
    return data
  },

  async addFriend(userId: string) {
    const { data } = await api.post(
      '/friends/request',
      { userId }
    )
    return data
  },

  async acceptFriend(id: string) {
    await api.post(`/friends/${id}/accept`)
  },

  async rejectFriend(id: string) {
    await api.post(`/friends/${id}/reject`)
  },

  async removeFriend(id: string) {
    await api.delete(`/friends/${id}`)
  },

  async messages(conversationId: string, cursor?: string) {
    const { data } = await api.get<MessageHistory>(
      `/conversations/${conversationId}/messages`,
      { params: { cursor, limit: 50 } }
    )
    return data
  },

  async sendMessage(
    conversationId: string,
    content: string,
    clientMessageId: string,
    replyToId?: string,
  ) {
    const { data } = await api.post<Message>(
      `/conversations/${conversationId}/messages`,
      { content, clientMessageId, replyToId }
    )
    return data
  },

  async editMessage(id: string, content: string) {
    const { data } = await api.patch<Message>(
      `/messages/${id}`,
      { content }
    )
    return data
  },

  async deleteMessage(id: string) {
    await api.delete(`/messages/${id}`)
  },

  async delivered(id: string) {
    await api.post(`/messages/${id}/delivered`)
  },

  async read(id: string) {
    await api.post(`/messages/${id}/read`)
  },

  async react(id: string, emoji: string) {
    const { data } = await api.put(
      `/messages/${id}/reaction`,
      { emoji }
    )
    return data
  },

  async removeReaction(id: string) {
    await api.delete(`/messages/${id}/reaction`)
  },

  async presence() {
    const { data } = await api.get<Presence[]>(
      '/presence/friends'
    )
    return data
  },
}
