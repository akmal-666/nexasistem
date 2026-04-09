'use client'
import { useEffect, useState } from 'react'
import { getUser, getTenant, logout } from '@/lib/utils'

// ─── Icons (inline SVG via CDN paths) ──────────────────────────
const Icon = ({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) => {
  const icons: Record<string, string> = {
    dashboard:   'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    fnb:         'M18 8h1a4 4 0 010 8h-1 M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3',
    retail:      'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0',
    klinik:      'M22 12h-4l-3 9L9 3l-3 9H2',
    laundry:     'M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4 M17 8l-5-5-5 5 M12 3v13',
    apotek:      'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
    salon:       'M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z M20 4l-16 16',
    properti:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    laporan:     'M18 20V10 M12 20V4 M6 20v-6',
    produk:      'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
    kasir:       'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17 M17 17a2 2 0 100 4 2 2 0 000-4z M9 17a2 2 0 100 4 2 2 0 000-4z',
    antrian:     'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    stok:        'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
    booking:     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    meja:        'M3 6h18 M3 12h18 M3 18h18',
    dokter:      'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    staf:        'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    unit:        'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    tagihan:     'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    order:       'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M12 12h.01 M12 16h.01',
    settings:    'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    logout:      'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
    menu:        'M3 12h18 M3 6h18 M3 18h18',
    close:       'M18 6L6 18 M6 6l12 12',
    moon:        'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
    sun:         'M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 5a7 7 0 100 14A7 7 0 0012 5z',
    chevronRight:'M9 18l6-6-6-6',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {(icons[name] || icons.dashboard).split(' M').map((d, i) => (
        <path key={i} d={i === 0 ? d : 'M' + d} />
      ))}
    </svg>
  )
}

// ─── Module config ──────────────────────────────────────────────
const MODULES = [
  { id: 'fnb', label: 'FnB', icon: 'fnb', color: '#F59E0B',
    links: [
      { href: '/fnb/kasir', label: 'Kasir', icon: 'kasir' },
      { href: '/fnb/meja', label: 'Meja', icon: 'meja' },
      { href: '/fnb/produk', label: 'Produk', icon: 'produk' },
      { href: '/fnb/laporan', label: 'Laporan', icon: 'laporan' },
    ]},
  { id: 'retail', label: 'Retail', icon: 'retail', color: '#3B82F6',
    links: [
      { href: '/retail/kasir', label: 'Kasir', icon: 'kasir' },
      { href: '/retail/produk', label: 'Produk', icon: 'produk' },
      { href: '/retail/stok', label: 'Stok', icon: 'stok' },
      { href: '/retail/laporan', label: 'Laporan', icon: 'laporan' },
    ]},
  { id: 'klinik', label: 'Klinik', icon: 'klinik', color: '#10B981',
    links: [
      { href: '/klinik/antrian', label: 'Antrian', icon: 'antrian' },
      { href: '/klinik/kasir', label: 'Kasir', icon: 'kasir' },
      { href: '/klinik/dokter', label: 'Dokter', icon: 'dokter' },
      { href: '/klinik/laporan', label: 'Laporan', icon: 'laporan' },
    ]},
  { id: 'laundry', label: 'Laundry', icon: 'laundry', color: '#8B5CF6',
    links: [
      { href: '/laundry/order', label: 'Order', icon: 'order' },
      { href: '/laundry/laporan', label: 'Laporan', icon: 'laporan' },
    ]},
  { id: 'apotek', label: 'Apotek', icon: 'apotek', color: '#EF4444',
    links: [
      { href: '/apotek/kasir', label: 'Kasir', icon: 'kasir' },
      { href: '/apotek/produk', label: 'Stok Obat', icon: 'produk' },
      { href: '/apotek/laporan', label: 'Laporan', icon: 'laporan' },
    ]},
  { id: 'salon', label: 'Salon', icon: 'salon', color: '#EC4899',
    links: [
      { href: '/salon/booking', label: 'Booking', icon: 'booking' },
      { href: '/salon/layanan', label: 'Layanan', icon: 'produk' },
      { href: '/salon/staf', label: 'Staf', icon: 'staf' },
      { href: '/salon/laporan', label: 'Laporan', icon: 'laporan' },
    ]},
  { id: 'properti', label: 'Properti', icon: 'properti', color: '#06B6D4',
    links: [
      { href: '/properti/unit', label: 'Unit', icon: 'unit' },
      { href: '/properti/tagihan', label: 'Tagihan', icon: 'tagihan' },
      { href: '/properti/laporan', label: 'Laporan', icon: 'laporan' },
    ]},
]

// Bottom nav items (mobile)
const BOTTOM_NAV = [
  { href: '/dashboard', label: 'Home', icon: 'dashboard' },
  { href: '/fnb/kasir', label: 'Kasir', icon: 'kasir' },
  { href: '/fnb/laporan', label: 'Laporan', icon: 'laporan' },
  { href: '/dashboard', label: 'Modul', icon: 'produk' },
]

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

  useEffect(() => {
    const u = getUser()
    const t = getTenant()
    if (!u) { window.location.href = '/login'; return }
    setUser(u)
    setTenant(t)

    // Dark mode dari localStorage
    const saved = localStorage.getItem('nx_theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    // Auto-expand modul aktif
    const active = MODULES.find(m => m.links.some(l => currentPath.startsWith(l.href.split('/').slice(0,2).join('/'))))
    if (active) setExpandedModule(active.id)
  }, [])

  function toggleDark() {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('nx_theme', next ? 'dark' : 'light')
  }

  function toggleModule(id: string) {
    setExpandedModule(prev => prev === id ? null : id)
  }

  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + '/')

  return (
    <div className="app-layout">
      {/* Overlay (mobile) */}
      <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ─── Sidebar ──────────────────────────── */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 34, height: 34,
              background: 'var(--accent)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>NX</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tenant?.name || 'Nexasistem'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {tenant?.business_type || 'UMKM'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div className="nav-section-label">General</div>
          <a href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <Icon name="dashboard" size={16} className="nav-icon" />
            Dashboard
          </a>

          <div className="nav-section-label" style={{ marginTop: 8 }}>Modul Bisnis</div>

          {MODULES.map(mod => {
            const isExpanded = expandedModule === mod.id
            const hasActive = mod.links.some(l => isActive(l.href))
            return (
              <div key={mod.id}>
                <div
                  className={`nav-item ${hasActive ? 'active' : ''}`}
                  onClick={() => toggleModule(mod.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Icon name={mod.icon} size={16} className="nav-icon" />
                  <span style={{ flex: 1 }}>{mod.label}</span>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    style={{ opacity: .5, transition: 'transform .2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                {isExpanded && (
                  <div style={{ paddingLeft: 8 }}>
                    {mod.links.map(link => (
                      <a key={link.href} href={link.href}
                        className={`nav-item ${isActive(link.href) ? 'active' : ''}`}
                        onClick={() => setSidebarOpen(false)}
                        style={{ fontSize: 13, padding: '7px 12px' }}
                      >
                        <Icon name={link.icon} size={14} className="nav-icon" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8 }}>
            <div style={{
              width: 30, height: 30,
              background: 'var(--accent-light)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
            <button onClick={logout} className="btn btn-ghost btn-icon" title="Keluar" style={{ padding: 6 }}>
              <Icon name="logout" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────── */}
      <main className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}
            style={{ display: 'none' }} id="menu-btn">
            <Icon name="menu" size={20} />
          </button>
          <style>{`@media(max-width:768px){#menu-btn{display:flex!important}}`}</style>

          <div style={{ flex: 1 }}>
            {title && (
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{title}</div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {actions}
            <button onClick={toggleDark} className="btn btn-ghost btn-icon" title="Toggle theme">
              <Icon name={darkMode ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="app-content fade-in">
          {(title || subtitle) && (
            <div className="page-header">
              <div>
                {title && <h1 className="page-title">{title}</h1>}
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
              </div>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* ─── Bottom Nav (mobile) ───────────────── */}
      <nav className="app-bottomnav">
        {BOTTOM_NAV.map(item => {
          const active = isActive(item.href)
          return (
            <a key={item.href + item.label} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 16px',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              textDecoration: 'none', fontSize: 10, fontWeight: 600,
            }}>
              <Icon name={item.icon} size={20} />
              {item.label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
