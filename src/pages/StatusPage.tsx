import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  LoaderCircle,
  XCircle,
  Server,
  MessageCircle,
} from 'lucide-react'

type Health = {
  status: string
  service: string
  version: string
  uptime: number
  timestamp: string
}

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/v1/health', {
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Backend unavailable')
        }

        return response.json()
      })
      .then(setHealth)
      .catch(error => {
        if (error.name !== 'AbortError') {
          setError(true)
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-10">
          <img
            src="/mikoschat.svg"
            alt="MikosChat"
            className="w-24 h-24 mb-6"
          />

          <h1 className="text-4xl font-bold tracking-tight">
            MikosChat
          </h1>

          <p className="text-muted mt-2">
            Stay connected.
          </p>
        </div>

        <div className="bg-sidebar border border-border rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-6">
            <Server className="text-primary" size={22} />
            <h2 className="font-semibold">
              System status
            </h2>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-muted">
              Frontend
            </span>

            <span className="flex items-center gap-2 text-online">
              <CheckCircle2 size={17} />
              Online
            </span>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-center justify-between py-3">
            <span className="text-muted">
              Backend API
            </span>

            {health ? (
              <span className="flex items-center gap-2 text-online">
                <CheckCircle2 size={17} />
                {health.status === 'online' ? 'Online' : health.status}
              </span>
            ) : error ? (
              <span className="flex items-center gap-2 text-danger">
                <XCircle size={17} />
                Offline
              </span>
            ) : (
              <LoaderCircle
                size={20}
                className="animate-spin text-primary"
              />
            )}
          </div>

          <div className="border-t border-border" />

          <div className="flex items-center justify-between py-3">
            <span className="text-muted">
              API version
            </span>

            <span className="font-mono text-sm">
              {health?.version ?? '---'}
            </span>
          </div>

          <div className="border-t border-border" />

          <div className="flex items-center justify-between py-3">
            <span className="text-muted">
              Backend uptime
            </span>

            <span className="font-mono text-sm">
              {health
                ? `${Math.floor(health.uptime / 60)} min`
                : '---'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 text-muted text-sm">
          <MessageCircle size={16} />
          MikosChat Web · Development
        </div>

      </div>
    </main>
  )
}

export default App
