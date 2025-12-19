import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasPassword, setHasPassword] = useState(false)
  const [needEncryption, setNeedEncryption] = useState(false)
  const [suggestedSecret, setSuggestedSecret] = useState('')

  const checkStatus = useCallback(async () => {
    try {
      // Check encryption first
      const encRes = await api.get('/check-encryption')
      if (!encRes.data.isConfigured) {
        setNeedEncryption(true)
        setSuggestedSecret(encRes.data.suggestedSecret)
        setLoading(false)
        return
      }

      // Check if password is set
      const passRes = await api.get('/check-password')
      setHasPassword(passRes.data.hasPassword)

      // Check session validity if token exists
      const token = localStorage.getItem('session_token')
      if (token) {
        try {
          // Try to fetch accounts as a way to validate session
          await api.get('/server-accounts')
          setIsAuthenticated(true)
        } catch (e) {
          if (e.response?.status === 401) {
            localStorage.removeItem('session_token')
            setIsAuthenticated(false)
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const login = async (password) => {
    try {
      const res = await api.post('/verify-password', { password })
      if (res.data.success) {
        localStorage.setItem('session_token', res.data.sessionToken)
        setIsAuthenticated(true)
        toast.success('登录成功')
        return true
      }
    } catch (e) {
      toast.error(e.response?.data?.error || '登录失败')
      return false
    }
  }

  const setAdminPassword = async (password) => {
    try {
      const res = await api.post('/set-password', { password })
      if (res.data.success) {
        // After setting, automatically login
        await login(password)
        setHasPassword(true)
        return true
      }
    } catch (e) {
      toast.error(e.response?.data?.error || '设置密码失败')
      return false
    }
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('session_token')
    setIsAuthenticated(false)
    toast.success('已退出登录')
  }

  return {
    isAuthenticated,
    loading,
    hasPassword,
    needEncryption,
    suggestedSecret,
    login,
    logout,
    setAdminPassword,
    checkStatus
  }
}
