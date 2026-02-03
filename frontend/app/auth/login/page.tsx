'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, User as UserIcon, Key, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth'
import api from '@/lib/api'

export default function LoginPage() {
    const router = useRouter()
    const setAuth = useAuthStore((state) => state.setAuth)

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [mfaCode, setMfaCode] = useState('')
    const [showMfa, setShowMfa] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await api.post('/auth/login', {
                username,
                password,
                ...(mfaCode && { mfaCode }),
            })

            const { accessToken, refreshToken } = response.data

            // Get user profile
            const profileResponse = await api.get('/auth/profile', {
                headers: { Authorization: `Bearer ${accessToken}` },
            })

            setAuth(profileResponse.data, accessToken, refreshToken)
            router.push('/dashboard')
        } catch (err: any) {
            if (err.response?.data?.message === 'MFA code required') {
                setShowMfa(true)
                setError('Please enter your MFA code')
            } else {
                setError(err.response?.data?.message || 'Login failed')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="h-20 w-20 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
                        <Shield className="h-10 w-10 text-blue-400" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">PulseLogic</h1>
                    <p className="text-slate-400 text-sm">
                        Clinical decision support and communication
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                Secure Identity
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="Enter ID"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="••••••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {showMfa && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    MFA Code
                                </label>
                                <input
                                    type="text"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-lg tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <Lock size={16} />
                            {loading ? 'Authenticating...' : 'Secure Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-500">
                            Authorized personnel only. All access is monitored and logged.
                        </p>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 text-emerald-400 text-sm">
                        <Lock size={12} />
                        <span className="font-mono">TLS 1.3 Encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
