'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

const MODULE_NAV: Record<string, { label: string; items: { href: string; label: string }[] }> = {
  fnb:      { label: 'FnB',      items: [{ href:'/fnb/kasir', label:'Kasir' },{ href:'/fnb/meja', label:'Meja' },{ href:'/fnb/produk', label:'Produk' },{ href:'/fnb/laporan', label:'Laporan' }] },
  retail:   { label: 'Retail',   items: [{ href:'/retail/kasir', label:'Kasir' },{ href:'/retail/produk', label:'Produk' },{ href:'/retail/stok', label:'Stok' },{ href:'/retail/laporan', label:'Laporan' }] },
  klinik:   { label: 'Klinik',   items: [{ href:'/klinik/antrian', label:'Antrian' },{ href:'/klinik/kasir', label:'Kasir' },{ href:'/klinik/dokter', label:'Dokter' },{ href:'/klinik/laporan', label:'Laporan' }] },
  laundry:  { label: 'Laundry',  items: [{ href:'/laundry/order', label:'Order' },{ href:'/laundry/laporan', label:'Laporan' }] },
  apotek:   { label: 'Apotek',   items: [{ href:'/apotek/kasir', label:'Kasir' },{ href:'/apotek/produk', label:'Produk' },{ href:'/apotek/resep', label:'Resep' },{ href:'/apotek/laporan', label:'Laporan' }] },
  salon:    { label: 'Salon',    items: [{ href:'/salon/booking', label:'Booking' },{ href:'/salon/layanan', label:'Layanan' },{ href:'/salon/laporan', label:'Laporan' }] },
  properti: { label: 'Properti', items: [{ href:'/properti/unit', label:'Unit' },{ href:'/properti/tagihan', label:'Tagihan' },{ href:'/properti/laporan', label:'Laporan' }] },
}

export default function AppLayout({ children, activeHref = '' }: { children: React.ReactNode; activeHref?: string }) {
  const [tenant, setTenant] = useState<any>(null)
  const [currentModule, setCurrentModule] = useState('fnb')

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(r => r.json())
      .then((d: any) => {
        if (!d.ok) { window.location.href = '/login'; return }
        setTenant(d.tenant)
        const path = window.location.pathname
        const mod = Object.keys(MODULE_NAV).find(m => path.startsWith('/' + m))
        if (mod) setCurrentModule(mod)
      })
      .catch(() => { window.location.href = '/login' })
  }, [])

  const modules: string[] = tenant?.modules || []
  const nav = MODULE_NAV[currentModule] || MODULE_NAV.fnb

  return (
    <div style={{ display:'flex', height:'100vh', background:'#F9FAFB', overflow:'hidden' }}>
      <aside style={{ width:'220px', background:'white', borderRight:'1px solid #F3F4F6', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'16px', borderBottom:'1px solid #F3F4F6' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'28px', height:'28px', background:'#4F46E5', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'white', fontWeight:'bold', fontSize:'11px' }}>NX</span>
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:'13px', fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tenant?.name || 'Nexasistem'}</div>
              <div style={{ fontSize:'11px', color:'#9CA3AF' }}>{tenant?.plan_name || 'Trial'}</div>
            </div>
          </div>
        </div>

        {modules.length > 1 && (
          <div style={{ padding:'8px 12px', borderBottom:'1px solid #F3F4F6' }}>
            <select value={currentModule} onChange={e => { setCurrentModule(e.target.value); window.location.href = (MODULE_NAV[e.target.value]?.items[0]?.href || '/dashboard') }}
              style={{ width:'100%', fontSize:'12px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'5px 8px', background:'white' }}>
              {modules.map((m: string) => <option key={m} value={m}>{MODULE_NAV[m]?.label || m}</option>)}
            </select>
          </div>
        )}

        <nav style={{ flex:1, padding:'8px 12px', overflowY:'auto' }}>
          <a href="/dashboard" style={{ display:'block', padding:'7px 12px', fontSize:'13px', borderRadius:'8px', marginBottom:'2px', color: activeHref==='/dashboard' ? '#4F46E5' : '#6B7280', background: activeHref==='/dashboard' ? '#EEF2FF' : 'transparent', fontWeight: activeHref==='/dashboard' ? 600 : 400, textDecoration:'none' }}>Dashboard</a>

          <div style={{ marginTop:'8px', marginBottom:'4px' }}>
            <div style={{ fontSize:'10px', fontWeight:600, color:'#9CA3AF', padding:'0 12px', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{nav.label}</div>
            {nav.items.map(item => (
              <a key={item.href} href={item.href} style={{ display:'block', padding:'7px 12px', fontSize:'13px', borderRadius:'8px', marginBottom:'2px', color: activeHref===item.href ? '#4F46E5' : '#6B7280', background: activeHref===item.href ? '#EEF2FF' : 'transparent', fontWeight: activeHref===item.href ? 600 : 400, textDecoration:'none' }}>
                {item.label}
              </a>
            ))}
          </div>

          <div style={{ marginTop:'8px' }}>
            <div style={{ fontSize:'10px', fontWeight:600, color:'#9CA3AF', padding:'0 12px', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Umum</div>
            {[{ href:'/pelanggan', label:'Pelanggan' },{ href:'/pengaturan', label:'Pengaturan' }].map(item => (
              <a key={item.href} href={item.href} style={{ display:'block', padding:'7px 12px', fontSize:'13px', borderRadius:'8px', marginBottom:'2px', color: activeHref===item.href ? '#4F46E5' : '#6B7280', background: activeHref===item.href ? '#EEF2FF' : 'transparent', fontWeight: activeHref===item.href ? 600 : 400, textDecoration:'none' }}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div style={{ padding:'12px', borderTop:'1px solid #F3F4F6' }}>
          <button onClick={async () => { await fetch(`${API_URL}/api/auth/logout`, { method:'POST', credentials:'include' }); window.location.href = '/login' }}
            style={{ width:'100%', padding:'7px 12px', fontSize:'13px', color:'#EF4444', background:'transparent', border:'none', borderRadius:'8px', cursor:'pointer', textAlign:'left' }}>
            Keluar
          </button>
        </div>
      </aside>

      <main style={{ flex:1, overflowY:'auto' }}>
        {children}
      </main>
    </div>
  )
}
