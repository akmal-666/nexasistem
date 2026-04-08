// v2
// frontend/apps/web/src/app/page.tsx
// Landing page - SSG (static, cepat di Cloudflare Pages)
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexasistem.com'

async function getCmsContent() {
  try {
    // Di Cloudflare Pages, fetch ke backend Workers
    const res = await fetch(`${API_URL}/api/cms/public`, { next: { revalidate: 3600 } })
    const data = await res.json() as any
    return data.content || {}
  } catch {
    return {}
  }
}

const MODULES = [
  { name: 'FnB & Restoran', icon: '🍜', desc: 'Kasir, menu, meja, laporan' },
  { name: 'Retail & Toko', icon: '🏪', desc: 'Stok, barcode, pembelian' },
  { name: 'Klinik', icon: '🏥', desc: 'Antrian, EMR, ICD-10' },
  { name: 'Laundry', icon: '👕', desc: 'Order, tracking, WA notif' },
  { name: 'Apotek', icon: '💊', desc: 'Obat keras, resep, expired alert' },
  { name: 'Salon', icon: '✂️', desc: 'Booking, stylist, reminder' },
  { name: 'Properti & Kos', icon: '🏠', desc: 'Unit, tagihan, WA reminder' },
]

const PLANS = [
  { name: 'Basic', price: 'Rp 99.000', period: '/bulan', features: ['1 Modul', '5 Pengguna', '1 Cabang', 'Kasir & Laporan', 'Print Struk', 'WA Notifikasi'] },
  { name: 'Pro', price: 'Rp 299.000', period: '/bulan', highlighted: true, features: ['3 Modul', '15 Pengguna', '3 Cabang', 'Semua fitur Basic', 'EMR Klinik', 'Export Data CSV'] },
  { name: 'Enterprise', price: 'Rp 599.000', period: '/bulan', features: ['Semua 7 Modul', 'Unlimited User', 'Unlimited Cabang', 'API Akses', 'Dedicated Support', 'SLA 99.9%'] },
]

export default async function HomePage() {
  const cms = await getCmsContent()

  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NX</span>
            </div>
            <span className="font-bold text-gray-900">Nexasistem</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.nexasistem.com'}/login`}
              className="text-sm text-gray-600 hover:text-gray-900">Masuk</Link>
            <Link href="#demo"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 text-center bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            Platform SaaS #1 untuk UMKM Indonesia
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            {cms.hero_title || 'Kelola Bisnis UMKM Lebih Mudah'}
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {cms.hero_subtitle || 'Platform SaaS all-in-one untuk FnB, Retail, Klinik, Laundry, Apotek, Salon, dan Properti'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="#demo"
              className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              {cms.hero_cta_primary || 'Coba Gratis 14 Hari'}
            </Link>
            <Link href="#fitur"
              className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Lihat Fitur
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Tidak perlu kartu kredit · Trial 14 hari gratis</p>
        </div>
      </section>

      {/* Modules */}
      <section id="fitur" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">7 Modul Bisnis dalam 1 Platform</h2>
            <p className="text-gray-600">Semua yang Anda butuhkan untuk mengelola bisnis, terintegrasi sempurna</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODULES.map(m => (
              <div key={m.name} className="border border-gray-100 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="text-3xl mb-3">{m.icon}</div>
                <div className="font-semibold text-gray-900 mb-1">{m.name}</div>
                <div className="text-sm text-gray-500">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Harga Transparan</h2>
            <p className="text-gray-600">Pilih paket sesuai kebutuhan bisnis Anda</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`rounded-2xl p-6 ${p.highlighted ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' : 'bg-white border border-gray-100'}`}>
                <div className={`text-sm font-medium mb-1 ${p.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{p.name}</div>
                <div className={`text-3xl font-bold mb-1 ${p.highlighted ? 'text-white' : 'text-gray-900'}`}>{p.price}</div>
                <div className={`text-sm mb-5 ${p.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>{p.period}</div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${p.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                      <span className={p.highlighted ? 'text-indigo-300' : 'text-green-500'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="#demo"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${p.highlighted ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  Mulai Sekarang
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo form */}
      <section id="demo" className="py-20 px-4 bg-white">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Coba Gratis 14 Hari</h2>
          <p className="text-gray-600 mb-8">Daftar sekarang dan mulai kelola bisnis Anda hari ini</p>
          <DemoForm apiUrl={API_URL} waNumber={cms.contact_wa} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">NX</span>
              </div>
              <span className="font-bold text-white">Nexasistem</span>
            </div>
            <p className="text-sm">{cms.footer_tagline || 'Solusi digital untuk UMKM Indonesia'}</p>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <div className="text-white font-medium mb-2">Produk</div>
              <div className="space-y-1"><a href="#fitur" className="hover:text-white block">Fitur</a><a href="#harga" className="hover:text-white block">Harga</a></div>
            </div>
            <div>
              <div className="text-white font-medium mb-2">Kontak</div>
              <div className="space-y-1"><a href={`mailto:${cms.contact_email || 'halo@nexasistem.com'}`} className="hover:text-white block">{cms.contact_email || 'halo@nexasistem.com'}</a></div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 text-xs text-center">
          © {new Date().getFullYear()} Nexasistem. Semua hak dilindungi.
        </div>
      </footer>
    </main>
  )
}

// Demo form component (client)
function DemoForm({ apiUrl, waNumber }: { apiUrl: string; waNumber?: string }) {
  'use client'
  return (
    <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4">
      <p className="text-sm text-gray-600 text-center">
        Hubungi kami untuk registrasi dan setup bisnis Anda
      </p>
      <a
        href={`https://wa.me/${waNumber || '6281234567890'}?text=Halo, saya tertarik coba Nexasistem untuk bisnis saya`}
        target="_blank" rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Chat WhatsApp
      </a>
    </div>
  )
}
