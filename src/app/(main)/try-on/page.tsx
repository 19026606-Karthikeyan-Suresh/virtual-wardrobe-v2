'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConsentModal } from '@/features/tryon/ConsentModal'
import { VTOGenerator } from '@/features/tryon/VTOGenerator'
import { VTOResultCard } from '@/features/tryon/VTOResultCard'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useVTOResults } from '@/hooks/useVTO'

type ConsentState = 'loading' | 'required' | 'granted'

export default function TryOnPage() {
  const user = useAuthStore((s) => s.user)
  const [consentState, setConsentState] = useState<ConsentState>('loading')
  const galleryRef = useRef<HTMLDivElement>(null)

  const { data: vtoResults } = useVTOResults()
  const recentResults = vtoResults?.slice(0, 3) ?? []

  useEffect(() => {
    if (!user) return

    async function checkConsent() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('vto_consent')
        .eq('id', user!.id)
        .single()

      if (error || !data) {
        setConsentState('required')
        return
      }

      setConsentState(data.vto_consent ? 'granted' : 'required')
    }

    checkConsent()
  }, [user])

  function handleConsent() {
    setConsentState('granted')
  }

  function handleGenerateSuccess() {
    // Scroll to gallery preview after a short delay to allow cache invalidation
    setTimeout(() => {
      galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 400)
  }

  return (
    <>
      <PageHeader title="Virtual Try-On" />

      {/* Consent modal */}
      <ConsentModal
        isOpen={consentState === 'required'}
        onConsent={handleConsent}
      />

      <div className="px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] max-w-lg mx-auto space-y-10">

        {/* Loading state */}
        {consentState === 'loading' && (
          <div className="space-y-4" aria-label="Loading" aria-busy="true">
            <Skeleton height={48} className="rounded-xl" />
            <Skeleton height={320} className="rounded-2xl" />
            <Skeleton height={48} className="rounded-xl" />
          </div>
        )}

        {/* Main generator */}
        {consentState === 'granted' && (
          <VTOGenerator onSuccess={handleGenerateSuccess} />
        )}

        {/* Recent try-ons preview */}
        {consentState === 'granted' && (
          <section ref={galleryRef} aria-labelledby="recent-tryon-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="recent-tryon-heading" className="text-sm font-semibold text-foreground">
                Recent Try-Ons
              </h2>
              <Link
                href="/try-on/gallery"
                className="text-xs text-brand hover:underline underline-offset-2"
              >
                View all →
              </Link>
            </div>

            {recentResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 rounded-2xl bg-surface-raised border border-border text-center">
                <p className="text-sm text-muted">Your generated try-ons will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentResults.map((result) => (
                  <VTOResultCard key={result.id} result={result} />
                ))}
                {(vtoResults?.length ?? 0) > 3 && (
                  <Link
                    href="/try-on/gallery"
                    className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border text-sm text-brand hover:bg-surface-raised transition-colors"
                  >
                    View all {vtoResults!.length} try-ons →
                  </Link>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  )
}
