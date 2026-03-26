'use client'

import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { OutfitCard } from '@/features/outfits/OutfitCard'
import { useOutfits } from '@/hooks/useOutfits'
import type { OutfitWithGarments } from '@/lib/types'

async function deleteOutfit(id: string): Promise<void> {
  const res = await fetch(`/api/outfits/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete outfit: ${res.statusText}`)
}

async function toggleFavourite(id: string, value: boolean): Promise<void> {
  const res = await fetch(`/api/outfits/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_favourite: value }),
  })
  if (!res.ok) throw new Error(`Failed to update outfit: ${res.statusText}`)
}

export default function OutfitsPage() {
  const queryClient = useQueryClient()
  const { data: outfits, isLoading } = useOutfits()

  const deleteMutation = useMutation({
    mutationFn: deleteOutfit,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['outfits'] })
      const previous = queryClient.getQueryData<OutfitWithGarments[]>(['outfits'])
      queryClient.setQueryData<OutfitWithGarments[]>(['outfits'], (old) =>
        old ? old.filter((o) => o.id !== id) : []
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['outfits'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] })
    },
  })

  const favouriteMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      toggleFavourite(id, value),
    onMutate: async ({ id, value }) => {
      await queryClient.cancelQueries({ queryKey: ['outfits'] })
      const previous = queryClient.getQueryData<OutfitWithGarments[]>(['outfits'])
      queryClient.setQueryData<OutfitWithGarments[]>(['outfits'], (old) =>
        old ? old.map((o) => (o.id === id ? { ...o, is_favourite: value } : o)) : []
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['outfits'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] })
    },
  })

  return (
    <>
      <PageHeader title="Outfits" />

      {isLoading && (
        <div className="columns-2 sm:columns-3 gap-3 px-4 py-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="break-inside-avoid mb-3">
              <Skeleton className="w-full aspect-[3/4] rounded-xl" />
              <Skeleton className="mt-2 h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!outfits || outfits.length === 0) && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No outfits yet</p>
            <p className="text-xs text-muted mt-1">Build your first outfit on the Lookbook Canvas</p>
          </div>
          <Link
            href="/outfits/new"
            className="mt-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            Create outfit
          </Link>
        </div>
      )}

      {!isLoading && outfits && outfits.length > 0 && (
        <div className="columns-2 sm:columns-3 gap-3 px-4 py-4">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onToggleFavourite={(id, value) => favouriteMutation.mutate({ id, value })}
            />
          ))}
        </div>
      )}

      {/* Floating "+" FAB */}
      <Link
        href="/outfits/new"
        aria-label="Create new outfit"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+16px)] right-4 z-40 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center hover:bg-brand-hover active:scale-95 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>
    </>
  )
}
