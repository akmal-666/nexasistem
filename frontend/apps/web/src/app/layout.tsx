import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'Nexasistem — Platform SaaS UMKM Indonesia',
  description: 'Kelola bisnis FnB, Retail, Klinik, Laundry, Apotek, Salon, dan Properti dalam satu platform.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
