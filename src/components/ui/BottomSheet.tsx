'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue } from 'framer-motion'

export interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Height snap points in px from the bottom, e.g. [300, 600]. Not yet implemented — reserved for future. */
  snapPoints?: number[]
  children: React.ReactNode
  className?: string
  /** Accessible name for the sheet dialog. */
  'aria-label'?: string
}

export function BottomSheet({ isOpen, onClose, children, className = '', 'aria-label': ariaLabel }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Focus first focusable element on open
  useEffect(() => {
    if (!isOpen) return
    const el = sheetRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    el?.focus()
  }, [isOpen])

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet-panel"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            style={{ y }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose()
              } else {
                y.set(0)
              }
            }}
            className={[
              'fixed bottom-0 left-0 right-0 z-50',
              'bg-surface rounded-t-2xl shadow-xl',
              'flex flex-col max-h-[90vh]',
              'pb-safe',
              className,
            ].join(' ')}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            >
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 pb-5 pt-2">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
