import {
  MessageCircle,
  UsersRound,
  UserRoundPlus,
  LogOut,
  Settings,
} from 'lucide-react'

import Avatar from '../common/Avatar'
import { useAuthStore } from '../../stores/auth.store'
import { logout } from '../../api/auth'

export type NavigationTab =
  | 'chats'
  | 'friends'
  | 'discover'
  | 'settings'

interface Props {
  tab: NavigationTab
  onChange: (tab: NavigationTab) => void
}

const items = [
  {
    id: 'chats',
    label: 'Rozmowy',
    icon: MessageCircle,
  },
  {
    id: 'friends',
    label: 'Znajomi',
    icon: UsersRound,
  },
  {
    id: 'discover',
    label: 'Znajdź znajomych',
    icon: UserRoundPlus,
  },
] as const

export default function NavigationRail({
  tab,
  onChange,
}: Props) {
  const user = useAuthStore(state => state.user)

  return (
    <nav className="w-[64px] shrink-0 bg-[#15161b] border-r border-border flex flex-col items-center py-4 gap-3">

      <img
        src="/mikoschat.svg"
        alt="MikosChat"
        className="w-10 h-10 mb-5"
      />

      {items.map(item => {
        const Icon = item.icon

        return (
          <button
            key={item.id}
            title={item.label}
            aria-label={item.label}
            aria-pressed={tab === item.id}
            onClick={() => onChange(item.id)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              tab === item.id
                ? 'bg-primary/20 text-primary-hover'
                : 'text-muted hover:bg-surface hover:text-white'
            }`}
          >
            <Icon size={22} />
          </button>
        )
      })}

      <div className="flex-1" />

      <button
        title="Ustawienia"
        aria-label="Ustawienia"
        aria-pressed={tab === 'settings'}
        onClick={() => onChange('settings')}
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
          tab === 'settings'
            ? 'bg-primary/20 text-primary-hover'
            : 'text-muted hover:bg-surface hover:text-white'
        }`}
      >
        <Settings size={21} />
      </button>

      <button
        title="Wyloguj się"
        aria-label="Wyloguj się"
        onClick={() => {
          void logout().catch(() => {
            window.alert(
              'Nie udało się wylogować. Sprawdź połączenie i spróbuj ponownie.',
            )
          })
        }}
        className="w-11 h-11 flex items-center justify-center text-muted hover:text-danger rounded-xl hover:bg-surface"
      >
        <LogOut size={20} />
      </button>

      <button
        title="Mój profil"
        aria-label="Mój profil"
        onClick={() => onChange('settings')}
        className="rounded-full hover:ring-2 hover:ring-primary transition-all"
      >
        <Avatar
          name={user?.displayName || 'User'}
          url={user?.avatarUrl}
          size={40}
        />
      </button>

    </nav>
  )
}
