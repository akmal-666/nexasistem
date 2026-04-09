'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatRp, apiFetch } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ApotekKasirPage() {
  const [drugs, setDrugs] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    apiFetch(`/api/modules/apotek?action=drugs${q ? '&q=' + q : ''}`)
      .then(d => setDrugs(d.drugs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [q])

  function addToCart(d: any) {
    if (d.stock <= 0) return toast.error('Stok habis')
    setCart(prev => {
      const ex = prev.find(i => i.id === d.id)
      if (ex) return prev.map(i => i.id === d.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...d, qty: 1 }]
    })
    setCartOpen(true)
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))
  }

  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0)
  const change = Math.max(0, parseInt(paid || '0') - subtotal)

  async function handlePay() {
    if (!cart.length) return toast.error('Pilih obat dulu')
    if (method === 'cash' && parseInt(paid) < subtotal) return toast.error('Bayar kurang')
    setPaying(true)
    try {
      const data = await apiFetch('/api/modules/apotek', {
        method: 'POST',
        body: JSON.stringify({
          action: 'checkout',
          items: cart.map(i => ({ product_id: i.id, name: i.name, qty: i.qty, unit: i.unit || 'strip', price: i.price })),
          paid_amount: method === 'cash' ? parseInt(paid) : subtotal,
          payment_method: method,
        }),
      })
      setResult({ order_number: data.order_number, change: data.change })
      setCart([])
      setCartOpen(false)
      toast.success('Transaksi berhasil!')
    } catch (err: any) { toast.error(err.message) }
    finally { setPaying(false) }
  }

  if (result) return (
    <AppLayout title="Kasir Apotek">
      <div style={{ maxWidth: 400, margin: '40px auto' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>Transaksi Berhasil</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 16 }}>{result.order_number}</p>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#10B981', marginBottom: 4 }}>{formatRp(result.change)}</div>
          <p style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 24 }}>Kembalian</p>
          <button onClick={() => { setResult(null); setPaid('') }} className="btn btn-primary btn-full btn-lg">Transaksi Baru</button>
        </div>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title="Kasir Apotek" subtitle="Penjualan obat dan alat kesehatan"
      actions={
        <button onClick={() => setCartOpen(!cartOpen)} className="btn btn-primary btn-sm" style={{ position: 'relative' }}>
          🛒 Keranjang
          {cart.length > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cart.reduce((a, i) => a + i.qty, 0)}
            </span>
          )}
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: cartOpen ? '1fr 300px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          <input className="form-input" placeholder="Cari nama obat atau SKU..." value={q}
            onChange={e => setQ(e.target.value)} style={{ marginBottom: 14 }} />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 10 }}>
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 10 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 10 }}>
              {drugs.map((d: any) => (
                <button key={d.id} onClick={() => addToCart(d)} disabled={d.stock <= 0}
                  style={{
                    background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                    borderRadius: 12, padding: '14px 12px', textAlign: 'left',
                    cursor: d.stock <= 0 ? 'not-allowed' : 'pointer',
                    opacity: d.stock <= 0 ? 0.5 : 1,
                    transition: 'border-color .15s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (d.stock > 0) (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', marginBottom: 3 }}>{formatRp(d.price)}</div>
                  <div style={{ fontSize: 11, color: d.stock <= d.min_stock ? '#EF4444' : 'var(--text-3)' }}>Stok: {d.stock} {d.unit || 'strip'}</div>
                </button>
              ))}
              {drugs.length === 0 && (
                <div style={{ gridColumn: '1/-1' }} className="empty">
                  <div className="empty-icon">💊</div>
                  <div className="empty-title">Obat tidak ditemukan</div>
                </div>
              )}
            </div>
          )}
        </div>

        {cartOpen && (
          <div className="card" style={{ position: 'sticky', top: 24 }}>
            <div className="card-hd">
              <span className="card-hd-title">Keranjang</span>
              <button onClick={() => setCartOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>✕</button>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div className="empty" style={{ padding: 24 }}>
                  <div className="empty-icon" style={{ fontSize: 24 }}>🛒</div>
                  <div className="empty-desc">Pilih obat</div>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)' }}>{formatRp(item.price)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => removeFromCart(item.id)} className="btn btn-ghost btn-sm" style={{ width: 26, height: 26, padding: 0 }}>−</button>
                    <span style={{ width: 20, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="btn btn-ghost btn-sm" style={{ width: 26, height: 26, padding: 0 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--accent)' }}>{formatRp(subtotal)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  {['cash','qris','transfer','kartu'].map(m => (
                    <button key={m} onClick={() => setMethod(m)} style={{
                      padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                      border: `1.5px solid ${method === m ? 'var(--accent)' : 'var(--border)'}`,
                      background: method === m ? 'var(--accent-bg)' : 'var(--bg)',
                      color: method === m ? 'var(--accent)' : 'var(--text-3)',
                      cursor: 'pointer', textTransform: 'capitalize',
                    }}>{m === 'cash' ? 'Tunai' : m}</button>
                  ))}
                </div>
                {method === 'cash' && (
                  <div style={{ marginBottom: 10 }}>
                    <input className="form-input" type="number" placeholder="Jumlah bayar"
                      value={paid} onChange={e => setPaid(e.target.value)} />
                    {parseInt(paid) >= subtotal && paid && (
                      <div style={{ fontSize: 12, color: '#10B981', marginTop: 4, fontWeight: 600 }}>Kembalian: {formatRp(change)}</div>
                    )}
                  </div>
                )}
                <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-full">
                  {paying ? 'Memproses...' : `Bayar ${formatRp(subtotal)}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}