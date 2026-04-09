'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function KlinikKasirPage() {
  const [services, setServices] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    apiFetch('/api/modules/klinik?action=services').then(d => setServices(d.services || [])).finally(() => setLoading(false))
  }, [])

  function addToCart(s: any) {
    setCart(prev => {
      const ex = prev.find(i => i.id === s.id)
      if (ex) return prev.map(i => i.id === s.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...s, qty: 1 }]
    })
  }

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0)
  const change = Math.max(0, parseInt(paid || '0') - subtotal)

  async function handlePay() {
    if (!cart.length) return toast.error('Pilih layanan dulu')
    if (method === 'cash' && parseInt(paid) < subtotal) return toast.error('Bayar kurang')
    setPaying(true)
    try {
      const data = await apiFetch('/api/modules/klinik', {
        method: 'POST',
        body: JSON.stringify({ action: 'kasir', items: cart.map(i => ({ product_id: i.id, name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })), paid_amount: method === 'cash' ? parseInt(paid) : subtotal, payment_method: method }),
      })
      setResult({ order_number: data.order_number, change: data.change })
    } catch (err: any) { toast.error(err.message) }
    finally { setPaying(false) }
  }

  if (result) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100 max-w-sm w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
        <h2 className="text-xl font-bold mb-1">Pembayaran Berhasil</h2>
        <p className="text-sm text-gray-500 mb-2">{result.order_number}</p>
        <div className="text-3xl font-bold text-green-600 my-4">{formatRp(result.change)}</div>
        <p className="text-gray-400 text-sm mb-6">Kembalian</p>
        <button onClick={() => { setResult(null); setCart([]); setPaid('') }} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium">Transaksi Baru</button>
      </div>
    </div>
  )

  return (
    <AppLayout title="Kasir Klinik" subtitle="Point of Sale">
    <div style={{display:'flex',gap:16,height:'calc(100vh - 60px - 48px)'}}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 p-4">
          <h1 className="font-bold text-gray-900">Kasir Klinik</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {services.map((s: any) => (
                <button key={s.id} onClick={() => addToCart(s)}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-indigo-300 hover:shadow-md transition-all active:scale-95">
                  <div className="text-sm font-medium text-gray-900 mb-1">{s.name}</div>
                  {s.category_name && <div className="text-xs text-gray-400 mb-1">{s.category_name}</div>}
                  <div className="text-base font-bold text-emerald-600">{formatRp(s.price)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="w-72 bg-white border-l border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 font-semibold">Kasir</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">Pilih layanan</div> : cart.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="text-xs text-emerald-600">{formatRp(item.price)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCart(p => p.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0))} className="w-7 h-7 rounded-lg border border-gray-200 text-sm font-bold">-</button>
                <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-lg border border-gray-200 text-sm font-bold">+</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-emerald-600">{formatRp(subtotal)}</span></div>
            <div className="grid grid-cols-2 gap-2">
              {['cash','qris','transfer','kartu'].map(m => (
                <button key={m} onClick={() => setMethod(m)} className={`py-2 rounded-lg text-xs font-medium border capitalize ${method === m ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200'}`}>{m === 'cash' ? 'Tunai' : m}</button>
              ))}
            </div>
            {method === 'cash' && (
              <div>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Jumlah bayar" value={paid} onChange={e => setPaid(e.target.value)} />
                {parseInt(paid) >= subtotal && <div className="text-green-600 text-sm mt-1">Kembalian: {formatRp(change)}</div>}
              </div>
            )}
            <button onClick={handlePay} disabled={paying} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-50">{paying ? 'Memproses...' : 'Bayar'}</button>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  )
}