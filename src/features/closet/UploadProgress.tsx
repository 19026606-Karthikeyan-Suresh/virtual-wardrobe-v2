'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import type { UploadStage } from '@/hooks/useUploadGarment'

export interface FileUploadState {
  file: File
  previewUrl: string
  stage: UploadStage
  progress: number
  error?: string
}

interface UploadProgressProps {
  items: FileUploadState[]
}

const stageLabel: Record<UploadStage, string> = {
  idle: 'Waiting…',
  uploading: 'Uploading…',
  processing: 'Removing background…',
  tagging: 'Tagging with AI…',
  done: 'Done',
  error: 'Failed',
}

export function UploadProgress({ items }: UploadProgressProps) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <motion.div
          key={item.previewUrl}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: idx * 0.05 }}
          className="flex items-center gap-3 bg-surface rounded-xl border border-border p-3"
        >
          {/* Thumbnail */}
          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-raised">
            <Image src={item.previewUrl} alt={item.file.name} fill className="object-cover" />
          </div>

          {/* Info + progress */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{item.file.name}</p>

            {/* Stage label */}
            <div className="h-4 relative overflow-hidden mt-0.5">
              <AnimatePresence mode="wait">
                <motion.p
                  key={item.stage}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className={[
                    'text-xs absolute inset-0',
                    item.stage === 'done' ? 'text-green-600 dark:text-green-400' :
                    item.stage === 'error' ? 'text-red-600 dark:text-red-400' :
                    'text-muted',
                  ].join(' ')}
                >
                  {item.stage === 'error' && item.error ? item.error : stageLabel[item.stage]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="mt-1.5 h-1.5 rounded-full bg-surface-raised overflow-hidden">
              <motion.div
                className={[
                  'h-full rounded-full',
                  item.stage === 'done' ? 'bg-green-500' :
                  item.stage === 'error' ? 'bg-red-500' :
                  'bg-brand',
                ].join(' ')}
                animate={{
                  width: item.stage === 'processing' || item.stage === 'tagging' || item.stage === 'done'
                    ? '100%'
                    : `${item.progress}%`
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
