import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  UserRound,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  LoaderCircle,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

import { motion } from 'framer-motion'
import { login, register } from '../api/auth'
import { getApiError } from '../api/client'

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        await register({
          username: username.trim(),
          email: email.trim(),
          displayName: displayName.trim(),
          password,
          remember,
        })
      } else {
        await login({
          identifier: identifier.trim(),
          password,
          remember,
          deviceName: 'MikosChat Web',
        })
      }
    } catch (error) {
      setError(getApiError(error))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-surface border border-border rounded-xl ' +
    'py-3.5 pl-11 pr-4 outline-none ' +
    'focus:border-primary focus:ring-2 ' +
    'focus:ring-primary/20 transition-all ' +
    'placeholder:text-muted/60'

  return (
    <main className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden">

      <div className="absolute w-[500px] h-[500px] bg-primary/10 blur-[140px] rounded-full -top-48 -left-48 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img
            src="/mikoschat.svg"
            alt="MikosChat"
            className="w-20 h-20 mx-auto mb-5"
          />

          <h1 className="text-3xl font-bold tracking-tight">
            Witaj w MikosChat
          </h1>

          <p className="text-muted mt-2 text-sm">
            Twoi znajomi. Twoje rozmowy. Twoje miejsce.
          </p>
        </div>

        <div className="bg-sidebar border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">

          <h2 className="text-xl font-semibold mb-6">
            {isRegister ? 'Utwórz konto' : 'Zaloguj się'}
          </h2>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 bg-danger/10 border border-danger/20 text-red-400 rounded-xl p-3 mb-5 text-sm"
            >
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">

            {isRegister ? (
              <>
                <div>
                  <label htmlFor="displayName" className="block text-sm mb-2">
                    Nazwa wyświetlana
                  </label>

                  <div className="relative">
                    <UserRound size={18} className="absolute left-4 top-4 text-muted" />

                    <input
                      id="displayName"
                      className={inputClass}
                      placeholder="Jak mamy Cię nazywać?"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      maxLength={64}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm mb-2">
                    Nazwa użytkownika
                  </label>

                  <div className="relative">
                    <UserRound size={18} className="absolute left-4 top-4 text-muted" />

                    <input
                      id="username"
                      className={inputClass}
                      placeholder="username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      autoComplete="username"
                      pattern="[a-zA-Z0-9_]{3,32}"
                      minLength={3}
                      maxLength={32}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm mb-2">
                    Adres e-mail
                  </label>

                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-4 text-muted" />

                    <input
                      id="email"
                      type="email"
                      className={inputClass}
                      placeholder="email@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="identifier" className="block text-sm mb-2">
                  Nazwa użytkownika lub e-mail
                </label>

                <div className="relative">
                  <UserRound size={18} className="absolute left-4 top-4 text-muted" />

                  <input
                    id="identifier"
                    className={inputClass}
                    placeholder="Wprowadź login"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm mb-2">
                Hasło
              </label>

              <div className="relative">
                <LockKeyhole size={18} className="absolute left-4 top-4 text-muted" />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-12`}
                  placeholder="Wprowadź hasło"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={isRegister ? 12 : undefined}
                  maxLength={128}
                  required
                />

                <button
                  type="button"
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-muted hover:text-white"
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />}
                </button>
              </div>

              {isRegister && (
                <p className="text-xs text-muted mt-2">
                  Minimum 12 znaków.
                </p>
              )}
            </div>

            <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Zapamiętaj mnie
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Utwórz konto' : 'Zaloguj się'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          <div className="border-t border-border mt-6 pt-6 text-center text-sm text-muted">
            {isRegister ? 'Masz już konto?' : 'Nie masz konta?'}

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
                setPassword('')
              }}
              className="ml-2 text-primary-hover font-medium hover:underline"
            >
              {isRegister ? 'Zaloguj się' : 'Zarejestruj się'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-8">
          MikosChat · Stay connected.
        </p>
      </motion.div>
    </main>
  )
}
