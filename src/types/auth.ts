export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl?: string | null
  bio?: string | null
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  sessionId: string
  expiresIn: number
}

export interface LoginData {
  remember?: boolean
  identifier: string
  password: string
  deviceName?: string
}

export interface RegisterData {
  remember?: boolean
  username: string
  email: string
  displayName: string
  password: string
}
