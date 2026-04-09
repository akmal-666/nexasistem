'use client'
import { useEffect, useState, useCallback } from 'react'
import { getUser, getTenant, logout } from '@/lib/utils'

// ─── Inline SVG Icons ──────────────────────────────────────────
const PATHS: Record<string, string> = {
  home:      'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  fnb:       'M18 8h1a4 4 0 010 8h-1 M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z M6 1v3 M10 1v3 M14 1v3',
  retail:    'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0',
  klinik:    'M22 12h-4l-3 9L9 3l-3 9H2',
  laundry:   'M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4 M17 8l-5-5-5 5 M12 3v13',
  apotek:    'M3 3h18v4H3z M3 7v13a2 2 0 002 2h14a2 2 0 002-2V7 M12 12v6 M9 15h6',
  salon:     'M20 4L8.12 15.88 M14.47 14.48L20 20 M8.12 8.12L12 12',
  properti:  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  chart:     'M18 20V10 M12 20V4 M6 20v-6',
  box:       'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  cart:      'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0',
  layers:    'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  cal:       'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  users:     'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  file:      'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  heart:     'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  scissors:  'M6 3a3 3 0 110 6 3 3 0 010-6z M18 21a3 3 0 110-6 3 3 0 010 6z M20 4L8.12 15.88 M14.47 14.48L20 20 M8.12 8.12L12 12',
  home2:     'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  menu:      'M3 12h18 M3 6h18 M3 18h18',
  x:         'M18 6L6 18 M6 6l12 12',
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  sun:       'M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 5a7 7 0 100 14A7 7 0 0012 5z',
  logout:    'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  chevron:   'M9 18l6-6-6-6',
  list:      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
  pill:      'M10.5 3a7.5 7.5 0 000 15h3a7.5 7.5 0 000-15h-3z M7.5 10.5h9',
}

function Ic({ n, s = 16, c = '' }: { n: string; s?: number; c?: string }) {
  const d = PATHS[n] || PATHS.home
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={c}
      style={{ flexShrink: 0 }}>
      {d.split(' M').map((seg, i) => <path key={i} d={i === 0 ? seg : 'M' + seg} />)}
    </svg>
  )
}

// ─── Nav config ────────────────────────────────────────────────
const NAV = [
  { id: 'fnb', label: 'FnB', icon: 'fnb',
    children: [
      { href: '/fnb/kasir', label: 'Kasir', icon: 'cart' },
      { href: '/fnb/meja', label: 'Meja', icon: 'layers' },
      { href: '/fnb/produk', label: 'Produk', icon: 'box' },
      { href: '/fnb/laporan', label: 'Laporan', icon: 'chart' },
    ]},
  { id: 'retail', label: 'Retail', icon: 'retail',
    children: [
      { href: '/retail/kasir', label: 'Kasir', icon: 'cart' },
      { href: '/retail/produk', label: 'Produk', icon: 'box' },
      { href: '/retail/stok', label: 'Stok', icon: 'layers' },
      { href: '/retail/laporan', label: 'Laporan', icon: 'chart' },
    ]},
  { id: 'klinik', label: 'Klinik', icon: 'klinik',
    children: [
      { href: '/klinik/antrian', label: 'Antrian', icon: 'users' },
      { href: '/klinik/kasir', label: 'Kasir', icon: 'cart' },
      { href: '/klinik/dokter', label: 'Dokter', icon: 'heart' },
      { href: '/klinik/laporan', label: 'Laporan', icon: 'chart' },
    ]},
  { id: 'laundry', label: 'Laundry', icon: 'laundry',
    children: [
      { href: '/laundry/order', label: 'Order', icon: 'list' },
      { href: '/laundry/laporan', label: 'Laporan', icon: 'chart' },
    ]},
  { id: 'apotek', label: 'Apotek', icon: 'apotek',
    children: [
      { href: '/apotek/kasir', label: 'Kasir', icon: 'cart' },
      { href: '/apotek/produk', label: 'Stok Obat', icon: 'pill' },
      { href: '/apotek/laporan', label: 'Laporan', icon: 'chart' },
    ]},
  { id: 'salon', label: 'Salon', icon: 'salon',
    children: [
      { href: '/salon/booking', label: 'Booking', icon: 'cal' },
      { href: '/salon/layanan', label: 'Layanan', icon: 'scissors' },
      { href: '/salon/staf', label: 'Staf', icon: 'users' },
      { href: '/salon/laporan', label: 'Laporan', icon: 'chart' },
    ]},
  { id: 'properti', label: 'Properti', icon: 'properti',
    children: [
      { href: '/properti/unit', label: 'Unit', icon: 'home2' },
      { href: '/properti/tagihan', label: 'Tagihan', icon: 'file' },
      { href: '/properti/laporan', label: 'Laporan', icon: 'chart' },
    ]},
]

const BNAV = [
  { href: '/dashboard', label: 'Home', icon: 'home' },
  { href: '/fnb/kasir', label: 'Kasir', icon: 'cart' },
  { href: '/fnb/laporan', label: 'Laporan', icon: 'chart' },
  { href: '/dashboard', label: 'Modul', icon: 'layers' },
]

interface Props {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function AppLayout({ children, title, subtitle, actions }: Props) {
  const [user, setUser] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [path, setPath] = useState('')

  useEffect(() => {
    const u = getUser()
    if (!u) { window.location.href = '/login'; return }
    setUser(u)
    setTenant(getTenant())
    setPath(window.location.pathname)

    // Dark mode
    const saved = localStorage.getItem('nx_theme')
    const isDark = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) { setDark(true); document.documentElement.classList.add('dark') }

    // Collapse state
    const col = localStorage.getItem('nx_sidebar') === 'collapsed'
    setCollapsed(col)

    // Auto-expand active module
    const active = NAV.find(m => m.children.some(c => window.location.pathname.startsWith('/' + m.id)))
    if (active) setExpanded(active.id)
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('nx_theme', next ? 'dark' : 'light')
  }

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('nx_sidebar', next ? 'collapsed' : 'open')
  }

  function toggleModule(id: string) {
    setExpanded(p => p === id ? null : id)
  }

  const isActive = useCallback((href: string) => path === href || path.startsWith(href + '/'), [path])

  const initials = (user?.name || 'U').charAt(0).toUpperCase()

  return (
    <div className="shell">
      {/* ── Overlay ── */}
      <div className={`mobile-overlay ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>NX</span>
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">{tenant?.name || 'Nexasistem'}</div>
            <div className="sidebar-logo-type">{tenant?.business_type || 'UMKM'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="nav-group-label">General</div>
          <a href="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}>
            <span className="nav-link-icon"><Ic n="home" s={16} /></span>
            <span className="nav-link-text">Dashboard</span>
          </a>

          <div className="nav-group-label" style={{ marginTop: 4 }}>Modul Bisnis</div>

          {NAV.map(mod => {
            const hasActive = mod.children.some(c => isActive(c.href))
            const isExpanded = expanded === mod.id
            return (
              <div key={mod.id}>
                <div className={`nav-link ${hasActive ? 'active' : ''}`} onClick={() => toggleModule(mod.id)}>
                  <span className="nav-link-icon"><Ic n={mod.icon} s={16} /></span>
                  <span className="nav-link-text">{mod.label}</span>
                  <span className={`nav-link-chevron ${isExpanded ? 'open' : ''}`}>
                    <Ic n="chevron" s={13} />
                  </span>
                </div>
                {isExpanded && (
                  <div className="nav-sub">
                    {mod.children.map(child => (
                      <a key={child.href} href={child.href}
                        className={`nav-sub-link ${isActive(child.href) ? 'active' : ''}`}
                        onClick={() => setMobileOpen(false)}>
                        <Ic n={child.icon} s={13} />
                        <span>{child.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button onClick={logout} className="icon-btn" title="Keluar" style={{ marginLeft: 'auto' }}>
              <Ic n="logout" s={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>

        {/* Topbar */}
        <header className="topbar">
          {/* Mobile hamburger */}
          <button className="icon-btn" onClick={() => setMobileOpen(true)}
            style={{ display: 'none' }} id="hamburger">
            <Ic n="menu" s={20} />
          </button>
          <style>{`@media(max-width:768px){#hamburger{display:flex!important}}`}</style>

          {/* Desktop collapse toggle */}
          <button className="icon-btn hide-mobile" onClick={toggleCollapse} title="Toggle sidebar">
            <Ic n="menu" s={18} />
          </button>

          {title ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="topbar-title truncate">{title}</div>
            </div>
          ) : <div style={{ flex: 1 }} />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {actions}
            <button className="icon-btn" onClick={toggleDark} title="Toggle tema">
              <Ic n={dark ? 'sun' : 'moon'} s={17} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="page fade-up">
          {(title || subtitle || actions) && (
            <div className="page-header">
              <div>
                {title && <h1 className="page-title">{title}</h1>}
                {subtitle && <p className="page-sub">{subtitle}</p>}
              </div>
            </div>
          )}
          {children}
        </div>
      </div>

      {/* ── Bottom Nav (mobile) ── */}
      <nav className="bottomnav">
        {BNAV.map((item, i) => (
          <a key={i} href={item.href} className={`bnav-item ${isActive(item.href) ? 'active' : ''}`}>
            <Ic n={item.icon} s={22} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}