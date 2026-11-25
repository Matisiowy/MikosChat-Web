export interface PublicUser {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  createdAt: string
}

export interface Friend {
  id: string
  since: string
  user: PublicUser
}

export interface FriendRequest {
  id: string
  sender?: PublicUser
  receiver?: PublicUser
  createdAt: string
}

export interface FriendRequests {
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
}

export interface ConversationMember {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  user: PublicUser
}

export interface Receipt {
  id: string
  messageId: string
  userId: string
  deliveredAt: string | null
  readAt: string | null
}

export interface Reaction {
  id: string
  messageId: string
  userId: string
  emoji: string
  createdAt: string
}

export interface Attachment {
  id: string
  messageId: string
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  duration: number | null
  createdAt: string
  downloadUrl: string
}

export interface ReplyMessage {
  id: string
  senderId: string
  content: string | null
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'SYSTEM'
  deletedAt: string | null
}

export interface Message {
  id: string
  clientMessageId: string
  conversationId: string
  senderId: string
  sender: PublicUser
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'SYSTEM'
  content: string | null
  createdAt: string
  editedAt: string | null
  deletedAt: string | null
  receipts: Receipt[]
  reactions: Reaction[]
  attachments?: Attachment[]
  replyToId?: string | null
  replyTo?: ReplyMessage | null
}

export interface Conversation {
  id: string
  type: 'DIRECT' | 'GROUP'
  name: string | null
  description?: string | null
  avatarUrl: string | null
  members: ConversationMember[]
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface MessageHistory {
  items: Message[]
  hasMore: boolean
  nextCursor: string | null
}

export interface Presence {
  userId: string
  online: boolean
  lastSeenAt: string | null
}

export interface MessageSearchResult {
  items: Message[]
  hasMore: boolean
}
