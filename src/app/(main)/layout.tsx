import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'

//Checks auth and renders bottom nav bar if auth is present
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    //Bottom padding for nav bar to ensure content is not hidden behind it
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
