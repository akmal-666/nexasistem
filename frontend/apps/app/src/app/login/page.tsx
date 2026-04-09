'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

export default function LoginPage() {
  const [form, setForm] = useState({ slug: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nx_theme')
    const isDark = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
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
    <>
      <style>{`
        body { background: var(--bg) !important; }
        .login-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: var(--bg);
          position: relative;
        }
        .login-card {
          width: 100%;
          max-width: 380px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .login-logo {
          width: 52px; height: 52px;
          background: var(--accent);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          box-shadow: var(--shadow-accent);
        }
        .login-title {
          font-size: 24px; font-weight: 800;
          color: var(--text-1);
          letter-spacing: -.04em;
          margin-bottom: 6px;
        }
        .login-subtitle { font-size: 14px; color: var(--text-3); }
        .login-form-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          box-shadow: var(--shadow-sm);
        }
        .pass-wrap { position: relative; }
        .pass-toggle {
          position: absolute; right: 11px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: var(--text-3); cursor: pointer;
          display: flex; align-items: center;
          padding: 4px;
          transition: color .15s;
        }
        .pass-toggle:hover { color: var(--text-2); }
        .theme-btn {
          position: absolute; top: 16px; right: 16px;
          width: 36px; height: 36px;
          border-radius: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-2);
          transition: background .15s;
        }
        .theme-btn:hover { background: var(--bg-hover); }
        .form-stack { display: flex; flex-direction: column; gap: 16px; }
        .login-footer { text-align: center; font-size: 12px; color: var(--text-3); margin-top: 18px; }
        .login-footer a { color: var(--accent); font-weight: 600; }
      `}</style>
      <div className="login-wrap">
        <button className="theme-btn" onClick={toggleDark}>
          {dark ? (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          )}
        </button>

        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>NX</span>
            </div>
            <h1 className="login-title">Selamat Datang</h1>
            <p className="login-subtitle">Masuk ke akun bisnis Anda</p>
          </div>

          <div className="login-form-card">
            <form onSubmit={handleSubmit} className="form-stack">
              <div className="form-group">
                <label className="form-label">ID Bisnis</label>
                <input className="form-input" placeholder="contoh: warung-budi"
                  value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().trim() }))} required />
                <span className="form-hint">ID unik yang diberikan saat daftar</span>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="email@bisnis.com"
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="pass-wrap">
                  <input type={showPass ? 'text' : 'password'} className="form-input"
                    placeholder="••••••••" style={{ paddingRight: 40 }}
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      {showPass
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn btn-primary btn-full btn-lg"
                style={{ marginTop: 4, borderRadius: 10 }}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="spinner" style={{ width: 16, height: 16 }} />
                      Memuat...
                    </span>
                  : 'Masuk ke Akun'}
              </button>
            </form>
          </div>

          <p className="login-footer">
            Belum punya akun?{' '}
            <a href="/setup">Setup bisnis baru</a>
          </p>
        </div>
      </div>
    </>
  )
}