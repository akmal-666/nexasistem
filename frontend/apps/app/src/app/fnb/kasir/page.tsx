'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatRp, apiFetch, getTenant } from '@/lib/utils'
import { printStruk } from '@/lib/print'
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
  const [cartOpen, setCartOpen] = useState(false)
  const tenant = getTenant()

  useEffect(() => {
    Promise.all([
      apiFetch('/api/modules/fnb'),
      apiFetch('/api/modules/fnb?action=tables'),
    ]).then(([pd, td]) => {
      setProducts(pd.products || [])
      setTables(td.tables || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))
  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0)
  const change = Math.max(0, parseInt(paid || '0') - subtotal)

  function addToCart(p: any) {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id)
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...p, qty: 1 }]
    })
    setCartOpen(true)
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0))
  }

  async function handlePay() {
    if (!cart.length) return toast.error('Keranjang kosong')
    const paidAmt = method === 'cash' ? parseInt(paid) : subtotal
    if (method === 'cash' && paidAmt < subtotal) return toast.error('Bayar kurang')
    setPaying(true)
    try {
      const order = await apiFetch('/api/modules/fnb', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_order',
          items: cart.map(i => ({ product_id: i.id, name: i.name, qty: i.qty, unit: 'pcs', price: i.price })),
          table_id: selectedTable || undefined,
        }),
      })
      const pay = await apiFetch('/api/modules/fnb', {
        method: 'POST',
        body: JSON.stringify({ action: 'pay_order', order_id: order.id, paid_amount: paidAmt, payment_method: method }),
      })
      const struKData = {
        business_name: tenant?.name || 'Warung',
        order_number: order.order_number,
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
        subtotal, total: subtotal, paid_amount: paidAmt, change: pay.change, payment_method: method,
      }
      setResult({ order_number: order.order_number, change: pay.change, struk: struKData })
      setCart([])
      setCartOpen(false)
      setPaid('')
      toast.success('Pembayaran berhasil!')
    } catch (err: any) { toast.error(err.message) }
    finally { setPaying(false) }
  }

  if (result) return (
    <AppLayout title="Kasir FnB">
      <div style={{ maxWidth: 400, margin: '40px auto' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Pembayaran Berhasil</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 16 }}>{result.order_number}</p>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#10B981', marginBottom: 4 }}>{formatRp(result.change)}</div>
          <p style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 24 }}>Kembalian</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => printStruk(result.struk)} className="btn btn-secondary" style={{ flex: 1 }}>🖨️ Print Struk</button>
            <button onClick={() => { setResult(null) }} className="btn btn-primary" style={{ flex: 1 }}>Transaksi Baru</button>
          </div>
        </div>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout title="Kasir FnB" subtitle="Point of Sale"
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
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <input className="form-input" placeholder="Cari menu..." value={q}
              onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
            {tables.length > 0 && (
              <select className="form-input form-select" value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)} style={{ width: 160 }}>
                <option value="">Take Away</option>
                {tables.filter(t => t.status === 'available').map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 10 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
              {filtered.map((p: any) => (
                <button key={p.id} onClick={() => addToCart(p)} style={{
                  background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                  borderRadius: 12, padding: '14px 12px', textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent)'; el.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = '' }}
                >
                  {p.category_name && <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{p.category_name}</div>}
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 5, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>{formatRp(p.price)}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1/-1' }} className="empty">
                  <div className="empty-icon">🍜</div>
                  <div className="empty-title">Tidak ada menu</div>
                  <div className="empty-desc">Tambah produk di menu Produk FnB</div>
                </div>
              )}
            </div>
          )}
        </div>

        {cartOpen && (
          <div className="card" style={{ position: 'sticky', top: 24 }}>
            <div className="card-hd">
              <span className="card-hd-title">Order</span>
              <button onClick={() => setCartOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}>✕</button>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div className="empty" style={{ padding: 24 }}>
                  <div className="empty-icon" style={{ fontSize: 24 }}>🛒</div>
                  <div className="empty-desc">Pilih menu untuk mulai</div>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)' }}>{formatRp(item.price)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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
                <button onClick={handlePay} disabled={paying} className="btn btn-primary btn-full" style={{ borderRadius: 10 }}>
                  {paying ? '⏳ Memproses...' : `💳 Bayar ${formatRp(subtotal)}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}