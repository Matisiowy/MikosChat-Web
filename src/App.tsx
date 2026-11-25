import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import { useAuthStore } from './stores/auth.store'

import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import StatusPage from './pages/StatusPage'

function App() {
  const user = useAuthStore(state => state.user)
  const accessToken = useAuthStore(state => state.accessToken)

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
              ? <HomePage />
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
