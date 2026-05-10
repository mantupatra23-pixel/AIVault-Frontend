import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Visora | Global AI Vault & Neural Directory',
  description: 'Discover 150+ verified AI tools and neural engines. Curated by Mantu Patra for AI innovators and creators worldwide.',
  keywords: 'AI directory, Artificial Intelligence, AI Tools, Neural Engines, Visora AI, Make in India SaaS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Adsense Script Placeholder */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ADSENSE_ID" crossOrigin="anonymous"></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
