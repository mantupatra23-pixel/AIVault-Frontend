import './globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Visora | Global AI Vault & Neural Directory',
  description: 'Discover 150+ verified AI tools and services.',
  keywords: 'AI directory, Artificial Intelligence, AI tools',
  verification: {
    google: 'Eu4N5bGiGJlgKiTyB77SeKDxfKrWJolQzphJAkPRK0k',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Adsense Script */}
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_CLIENT_ID" 
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
