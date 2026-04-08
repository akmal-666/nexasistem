'use client'
import { useEffect, useState } from 'react'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function FnbKasirPage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [tables, setTables] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState('')
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    Promise.all([
      apiFetch('/api/modules/fnb?action=products'),
      apiFetch('/api/modules/fnb?action=tables'),
    ]).then(([pd, td]) => {
      setProducts(pd.products || [])
      setTables(td.tables || [])
    }).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))

  function addToCart(p: any) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id)
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...p, qty: 1 }]
    })
  }

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0)
  const change = Math.max(0, parseInt(paid || '0') - subtotal)

  async function handlePay() {
    if (!cart.length) return toast.error('Keranjang kosong')
    if (method === 'cash' && parseInt(paid) < subtotal) return toast.error('Bayar kurang')
    setPaying(true)
    try {
      const order = await apiFetch('/api/modules/fnb', {
        method: 'POST',
        body: JSON.stringify({ action: 'create_order', items: cart.map(i => ({ product_id: i.id, name: i.name, qty: i.qty, unit: i.unit || 'pcs', price: i.price })), table_id: selectedTable || undefined }),
      })
      const pay = await apiFetch('/api/modules/fnb', {
        method: 'POST',
        body: JSON.stringify({ action: 'pay_order', order_id: order.id, paid_amount: method === 'cash' ? parseInt(paid) : subtotal, payment_method: method }),
      })
      setResult({ order_number: order.order_number, change: pay.change })
      toast.success('Pembayaran berhasil!')
    } catch (err: any) { toast.error(err.message) }
    finally { setPaying(false) }
  }

  if (result) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100 max-w-sm w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Pembayaran Berhasil</h2>
        <p className="text-gray-500 text-sm mb-2">{result.order_number}</p>
        <div className="text-3xl font-bold text-green-600 my-4">{formatRp(result.change)}</div>
        <p className="text-gray-400 text-sm mb-6">Kembalian</p>
        <button onClick={() => { setResult(null); setCart([]); setPaid(''); setSelectedTable('') }}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          Transaksi Baru
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Produk */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-gray-900">Kasir FnB</h1>
            <a href="/fnb/meja" className="text-sm text-indigo-600 hover:underline">Lihat Meja →</a>
          </div>
          <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Cari menu..." value={q} onChange={e => setQ(e.target.value)} />
          {tables.length > 0 && (
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
              <option value="">Tanpa meja / Take away</option>
              {tables.filter(t => t.status === 'available').map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((p: any) => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-indigo-300 hover:shadow-md transition-all active:scale-95">
                  <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{p.name}</div>
                  {p.category_name && <div className="text-xs text-gray-400 mb-1">{p.category_name}</div>}
                  <div className="text-base font-bold text-indigo-600">{formatRp(p.price)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-72 bg-white border-l border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Order</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Pilih menu</div>
          ) : cart.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="text-xs text-indigo-600">{formatRp(item.price)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCart(p => p.map(i => i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0))}
                  className="w-7 h-7 rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50">-</button>
                <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                <button onClick={() => addToCart(item)}
                  className="w-7 h-7 rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50">+</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-indigo-600">{formatRp(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['cash','qris','transfer','kartu'].map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`py-2 rounded-lg text-xs font-medium border capitalize transition-colors ${method === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200'}`}>
                  {m === 'cash' ? 'Tunai' : m}
                </button>
              ))}
            </div>
            {method === 'cash' && (
              <div>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="Jumlah bayar" value={paid} onChange={e => setPaid(e.target.value)} />
                {parseInt(paid) >= subtotal && <div className="text-green-600 text-sm mt-1">Kembalian: {formatRp(change)}</div>}
              </div>
            )}
            <button onClick={handlePay} disabled={paying}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {paying ? 'Memproses...' : 'Bayar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
