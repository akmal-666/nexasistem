'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

export default function LoginPage() {
  const [form, setForm] = useState({ slug: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nx_theme')
    if (saved === 'dark') { setDarkMode(true); document.documentElement.classList.add('dark') }
  }, [])

  function toggleDark() {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('nx_theme', next ? 'dark' : 'light')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.slug || !form.email || !form.password) return toast.error('Semua field wajib diisi')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as any
      if (!data.ok) throw new Error(data.error)
      localStorage.setItem('nx_token', data.token)
      localStorage.setItem('nx_user', JSON.stringify(data.user))
      localStorage.setItem('nx_tenant', JSON.stringify(data.tenant))
      window.location.href = '/dashboard'
    } catch (err: any) {
      toast.error(err.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
    }}>
      {/* Theme toggle */}
      <button onClick={toggleDark} style={{
        position: 'absolute', top: 20, right: 20,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px', cursor: 'pointer',
        color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center',
      }}>
        {darkMode ? (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--accent)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(99,102,241,.3)',
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: 18, fontFamily: 'Plus Jakarta Sans' }}>NX</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-.02em', marginBottom: 6 }}>
            Selamat Datang
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Masuk ke akun bisnis Anda</p>
        </div>

        {/* Form */}
        <div className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">ID Bisnis</label>
              <input className="form-input" placeholder="contoh: warung-budi"
                value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().trim() }))} required />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>ID unik bisnis Anda</p>
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="email@bisnis.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                  style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 4, borderRadius: 10 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Memuat...
                </span>
              ) : 'Masuk'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          Belum punya akun?{' '}
          <a href="/setup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Setup bisnis</a>
        </p>
      </div>
    </div>
  )
}
