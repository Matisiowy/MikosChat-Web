import { useEffect, useState } from 'react'

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { LoaderCircle } from 'lucide-react'
import { useAuthStore } from './stores/auth.store'
import { restoreSession } from './api/auth'

import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import StatusPage from './pages/StatusPage'

function App() {
  const user = useAuthStore(state => state.user)
  const accessToken = useAuthStore(state => state.accessToken)
  const initialized = useAuthStore(state => state.initialized)

  const [failed, setFailed] = useState(false)

  async function initialize() {
    setFailed(false)

    try {
      await restoreSession()
    } catch {
      if (!useAuthStore.getState().initialized) {
        setFailed(true)
      }
    }
  }

  useEffect(() => {
    void initialize()

    function onStorage(event: StorageEvent) {
      if (event.key === 'mikoschat-session-event') {
        window.location.reload()
      }
    }

    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  if (!initialized) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-5">
        <img
          src="/mikoschat.svg"
          alt="MikosChat"
          className="w-20 h-20"
        />

        {failed ? (
          <>
            <p className="text-muted text-sm">
              Nie można przywrócić sesji.
            </p>

            <button
              onClick={() => void initialize()}
              className="bg-primary rounded-xl px-5 py-3"
            >
              Spróbuj ponownie
            </button>
          </>
        ) : (
          <>
            <LoaderCircle
              size={26}
              className="animate-spin text-primary"
            />

            <p className="text-muted text-sm">
              Przywracanie sesji...
            </p>
          </>
        )}
      </main>
    )
  }

  const authenticated = Boolean(user && accessToken)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authenticated
              ? <Navigate to="/" replace />
              : <AuthPage />
          }
        />

        <Route
          path="/"
          element={
            authenticated
              ? <HomePage key={user?.id} />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/status"
          element={<StatusPage />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
