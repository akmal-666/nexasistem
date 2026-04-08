'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ slug: '', name: '', email: '', password: '', confirm: '', business_name: '' })
  const [loading, setLoading] = useState(false)

  async function checkSlug() {
    if (!form.slug) return toast.error('Masukkan ID bisnis')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/setup/check?slug=${form.slug}`)
      const data = await res.json() as any
      if (!data.ok) throw new Error(data.error)
      if (data.has_users) {
        toast.error('Bisnis sudah punya pengguna. Silakan login.')
        window.location.href = `/login?slug=${form.slug}`
        return
      }
      setForm(p => ({ ...p, business_name: data.tenant_name }))
      setStep(2)
    } catch (err: any) {
      toast.error(err.message || 'ID bisnis tidak ditemukan')
    } finally {
      setLoading(false)
    }
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
      toast.success('Akun berhasil dibuat! Silakan login.')
      window.location.href = `/login?slug=${form.slug}`
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat akun')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-lg">NX</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Setup Akun Bisnis</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? 'Masukkan ID bisnis dari admin' : `Buat akun untuk ${form.business_name}`}
          </p>
        </div>
        <div className="flex gap-2 mb-6">
          {[1,2].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">ID Bisnis *</label>
                <input className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="warung-pak-budi" value={form.slug}
                  onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().trim() }))} />
              </div>
              <button onClick={checkSlug} disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                {loading ? 'Memeriksa...' : 'Lanjutkan'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm">
                <div className="text-xs text-indigo-500">Bisnis</div>
                <div className="font-semibold text-indigo-900">{form.business_name}</div>
              </div>
              {[
                { label: 'Nama Lengkap *', key: 'name', type: 'text' },
                { label: 'Email *', key: 'email', type: 'email' },
                { label: 'Password *', key: 'password', type: 'password' },
                { label: 'Konfirmasi Password *', key: 'confirm', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type={f.type}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required />
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                  Kembali
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                  {loading ? 'Membuat...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">
          Sudah punya akun? <a href="/login" className="text-indigo-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  )
}
