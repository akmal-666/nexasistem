'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ slug: '', name: '', email: '', password: '', confirm: '', business_name: '' })
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nx_theme')
    if (saved === 'dark') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  async function checkSlug() {
    if (!form.slug) return toast.error('Masukkan ID bisnis')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/setup/check?slug=${form.slug}`)
      const data = await res.json() as any
      if (!data.ok) throw new Error(data.error)
      if (data.has_users) {
        toast.error('Bisnis sudah punya akun. Silakan login.')
        window.location.href = `/login?slug=${form.slug}`
        return
      }
      setForm(p => ({ ...p, business_name: data.tenant_name }))
      setStep(2)
    } catch (err: any) { toast.error(err.message || 'ID bisnis tidak ditemukan') }
    finally { setLoading(false) }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Password tidak cocok')
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/setup/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: form.slug, name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json() as any
      if (!data.ok) throw new Error(data.error)
      toast.success('Akun berhasil dibuat!')
      window.location.href = `/login?slug=${form.slug}`
    } catch (err: any) { toast.error(err.message || 'Gagal membuat akun') }
    finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        body { background: var(--bg) !important; }
        .setup-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; background: var(--bg); }
        .setup-card { width: 100%; max-width: 400px; }
        .setup-logo { width: 52px; height: 52px; background: var(--accent); border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: var(--shadow-accent); }
        .setup-steps { display: flex; gap: 6px; margin-bottom: 24px; }
        .setup-step { flex: 1; height: 3px; border-radius: 99px; background: var(--border); transition: background .3s; }
        .setup-step.active { background: var(--accent); }
        .form-stack { display: flex; flex-direction: column; gap: 14px; }
      `}</style>
      <div className="setup-wrap">
        <div className="setup-card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div className="setup-logo"><span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>NX</span></div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-.03em', marginBottom: 5 }}>Setup Akun Bisnis</h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{step === 1 ? 'Masukkan ID bisnis Anda' : `Buat akun untuk ${form.business_name}`}</p>
          </div>

          <div className="setup-steps">
            <div className={`setup-step ${step >= 1 ? 'active' : ''}`} />
            <div className={`setup-step ${step >= 2 ? 'active' : ''}`} />
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            {step === 1 ? (
              <div className="form-stack">
                <div className="form-group">
                  <label className="form-label">ID Bisnis</label>
                  <input className="form-input" placeholder="warung-budi"
                    value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().trim() }))} autoFocus />
                  <span className="form-hint">ID unik yang diberikan admin Nexasistem</span>
                </div>
                <button onClick={checkSlug} disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ borderRadius: 10 }}>
                  {loading ? 'Memeriksa...' : 'Lanjutkan →'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSetup} className="form-stack">
                <div style={{ background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--accent)', marginBottom: 2 }}>Bisnis</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{form.business_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>ID: {form.slug}</div>
                </div>
                {[
                  { label: 'Nama Lengkap', key: 'name', type: 'text', placeholder: 'Nama pemilik akun' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'email@bisnis.com' },
                  { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 6 karakter' },
                  { label: 'Konfirmasi Password', key: 'confirm', type: 'password', placeholder: 'Ulangi password' },
                ].map(field => (
                  <div key={field.key} className="form-group">
                    <label className="form-label">{field.label}</label>
                    <input type={field.type} className="form-input" placeholder={field.placeholder}
                      value={(form as any)[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))} required />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ borderRadius: 10 }}>← Kembali</button>
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, borderRadius: 10 }}>
                    {loading ? 'Membuat...' : 'Buat Akun'}
                  </button>
                </div>
              </form>
            )}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 18 }}>
            Sudah punya akun? <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Login</a>
          </p>
        </div>
      </div>
    </>
  )
}