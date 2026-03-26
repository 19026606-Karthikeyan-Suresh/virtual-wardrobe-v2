'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  /** Accessible label when no visible title is provided. Required if title is omitted | screen readers. */
  'aria-label'?: string
  children: React.ReactNode
  className?: string
  /** When false, clicking the overlay and pressing Escape will NOT close the modal.
   *  Use for required-choice modals (e.g. consent flows). Defaults to true. */
  dismissible?: boolean
}

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ isOpen, onClose, title, children, className = '', dismissible = true, 'aria-label': ariaLabel }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus first focusable element when opened
  useEffect(() => {
    if (!isOpen) return
    const el = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)
    el?.focus()
  }, [isOpen])

  // Focus trap — cycle Tab/Shift+Tab within modal
  useEffect(() => {
    if (!isOpen) return
    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? []
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  // Escape key to close (only when dismissible)
  useEffect(() => {
    if (!isOpen || !dismissible) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose, dismissible])

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden="true"
            onClick={dismissible ? onClose : undefined}
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-label={!title ? ariaLabel : undefined}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              key="modal-panel"
              ref={panelRef}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={[
                'relative w-full max-w-md bg-surface rounded-2xl shadow-xl',
                'flex flex-col max-h-[90vh]',
                className,
              ].join(' ')}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
                  <h2 id="modal-title" className="text-base font-semibold text-foreground">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-raised transition focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
