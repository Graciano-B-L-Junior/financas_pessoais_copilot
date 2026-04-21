import '@/styles/globals.css'
import { useRouter } from 'next/router'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/components/ui/Toast'
import AppLayout from '@/components/layout/AppLayout'

const PUBLIC_ROUTES = ['/', '/login']

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isPublic = PUBLIC_ROUTES.includes(router.pathname)

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          {isPublic ? (
            <Component {...pageProps} />
          ) : (
            <AppLayout>
              <Component {...pageProps} />
            </AppLayout>
          )}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
