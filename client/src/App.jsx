import React from 'react'
import { useAuth } from './hooks/useAuth'
import { Login, SetPassword, EncryptionWarning } from './components/Login'
import Dashboard from './components/Dashboard'
import { Loader2 } from 'lucide-react'

function App() {
  const { 
    isAuthenticated, 
    loading, 
    hasPassword, 
    needEncryption, 
    suggestedSecret, 
    login, 
    setAdminPassword 
  } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (needEncryption) {
    return <EncryptionWarning secret={suggestedSecret} />
  }

  if (!hasPassword) {
    return <SetPassword onSet={setAdminPassword} />
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />
  }

  return <Dashboard />
}

export default App
