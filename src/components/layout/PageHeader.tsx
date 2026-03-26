'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

interface PageHeaderProps {
  title: string
  showBack?: boolean
  right?: React.ReactNode
}

export default function PageHeader({ title, showBack = false, right }: PageHeaderProps) {
  const router = useRouter()
  const { signOut } = useAuthStore()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }
  //Back button on detail pages (edit, add etc) and sign out button
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center h-14 px-4 gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 -ml-1 rounded-lg text-foreground hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        <h1 className="flex-1 text-base font-semibold text-foreground truncate">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          {right}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Sign out"
            title="Sign out"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
