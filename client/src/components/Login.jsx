import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, AlertTriangle, Key, Copy, Check } from "lucide-react"
import toast from 'react-hot-toast'

export function EncryptionWarning({ secret }) {
  const [copied, setCopied] = useState(false)

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    toast.success('密钥已复制')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg border-yellow-500/50 bg-yellow-50/90 dark:bg-yellow-900/20 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>安全配置必需</CardTitle>
          </div>
          <CardDescription>
            为了保护您的 API Token 安全，系统检测到尚未配置加密密钥。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg text-sm space-y-2">
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">设置步骤:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>复制下方生成的密钥</li>
              <li>在服务器项目根目录创建或编辑 <code className="bg-muted px-1 rounded">.env</code> 文件</li>
              <li>添加一行: <code className="bg-muted px-1 rounded">ACCOUNTS_SECRET=密钥</code></li>
              <li>重启服务</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">您的专属加密密钥:</label>
            <div 
              className="relative group cursor-pointer"
              onClick={copySecret}
            >
              <div className="p-3 bg-muted rounded-md font-mono text-xs break-all border border-transparent group-hover:border-primary transition-colors">
                {secret}
              </div>
              <div className="absolute inset-y-0 right-2 flex items-center">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={copySecret}>
            复制密钥并去配置
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export function SetPassword({ onSet }) {
  const [password, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('密码至少需要6位')
    if (password !== confirm) return toast.error('两次密码不一致')
    
    setLoading(true)
    const success = await onSet(password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-blue-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>欢迎使用 Zeabur Monitor</CardTitle>
          <CardDescription>请设置管理员密码以保护您的数据</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              type="password" 
              placeholder="请输入密码 (至少6位)" 
              value={password}
              onChange={e => setPass(e.target.value)}
            />
            <Input 
              type="password" 
              placeholder="确认密码" 
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '设置中...' : '设置密码'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function Login({ onLogin }) {
  const [password, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    await onLogin(password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-blue-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>管理员登录</CardTitle>
          <CardDescription>请输入密码以继续</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              type="password" 
              placeholder="密码" 
              value={password}
              onChange={e => setPass(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
