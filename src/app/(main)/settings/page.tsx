'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/layout/PageHeader'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { User } from '@/lib/types'

interface FormState {
  display_name: string
  location_lat: string
  location_lng: string
  vto_consent: boolean
}

interface SaveStatus {
  profile: 'idle' | 'saving' | 'saved' | 'error'
  location: 'idle' | 'saving' | 'saved' | 'error'
  vto: 'idle' | 'saving' | 'saved' | 'error'
  avatar: 'idle' | 'saving' | 'saved' | 'error'
}

export default function SettingsPage() {
  const router = useRouter()
  const { signOut } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    display_name: '',
    location_lat: '',
    location_lng: '',
    vto_consent: false,
  })
  const [status, setStatus] = useState<SaveStatus>({
    profile: 'idle',
    location: 'idle',
    vto: 'idle',
    avatar: 'idle',
  })
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Load user profile on mount
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        setLoadError('Could not load profile. Check your connection.')
        return
      }

      const userData = data as User
      setProfile(userData)
      setForm({
        display_name: userData.display_name ?? '',
        location_lat: userData.location_lat != null ? String(userData.location_lat) : '',
        location_lng: userData.location_lng != null ? String(userData.location_lng) : '',
        vto_consent: userData.vto_consent ?? false,
      })

      // Generate avatar URL from storage path if present
      if (userData.avatar_url) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(userData.avatar_url)
        setAvatarUrl(urlData.publicUrl)
      }
    }

    loadProfile()
  }, [])

  async function saveProfile() {
    if (!profile) return
    setStatus((s) => ({ ...s, profile: 'saving' }))
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ display_name: form.display_name.trim() })
        .eq('id', profile.id)
      if (error) throw error
      await supabase.auth.updateUser({ data: { display_name: form.display_name.trim() } })
      setStatus((s) => ({ ...s, profile: 'saved' }))
      setTimeout(() => setStatus((s) => ({ ...s, profile: 'idle' })), 2000)
    } catch {
      setStatus((s) => ({ ...s, profile: 'error' }))
    }
  }

  async function saveLocation() {
    if (!profile) return
    setStatus((s) => ({ ...s, location: 'saving' }))
    try {
      const supabase = createClient()
      const lat = form.location_lat ? parseFloat(form.location_lat) : null
      const lng = form.location_lng ? parseFloat(form.location_lng) : null
      const { error } = await supabase
        .from('users')
        .update({ location_lat: lat, location_lng: lng })
        .eq('id', profile.id)
      if (error) throw error
      setStatus((s) => ({ ...s, location: 'saved' }))
      setTimeout(() => setStatus((s) => ({ ...s, location: 'idle' })), 2000)
    } catch {
      setStatus((s) => ({ ...s, location: 'error' }))
    }
  }

  async function saveVtoConsent(value: boolean) {
    if (!profile) return
    setForm((f) => ({ ...f, vto_consent: value }))
    setStatus((s) => ({ ...s, vto: 'saving' }))
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .update({ vto_consent: value })
        .eq('id', profile.id)
      if (error) throw error
      setStatus((s) => ({ ...s, vto: 'saved' }))
      setTimeout(() => setStatus((s) => ({ ...s, vto: 'idle' })), 2000)
    } catch {
      setStatus((s) => ({ ...s, vto: 'error' }))
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setStatus((s) => ({ ...s, avatar: 'error' }))
      return
    }

    setStatus((s) => ({ ...s, avatar: 'saving' }))
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: path })
        .eq('id', profile.id)
      if (updateError) throw updateError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(urlData.publicUrl)
      setStatus((s) => ({ ...s, avatar: 'saved' }))
      setTimeout(() => setStatus((s) => ({ ...s, avatar: 'idle' })), 2000)
    } catch {
      setStatus((s) => ({ ...s, avatar: 'error' }))
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' })
      if (!res.ok) throw new Error('Deletion failed')
      await signOut()
      router.push('/login')
    } catch {
      setDeleteError('Could not delete account. Please try again.')
      setIsDeleting(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition'

  const saveLabel = (s: SaveStatus[keyof SaveStatus]) => {
    if (s === 'saving') return 'Saving…'
    if (s === 'saved') return 'Saved'
    if (s === 'error') return 'Error — try again'
    return 'Save'
  }

  const saveBtnClass = (s: SaveStatus[keyof SaveStatus]) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
      s === 'saved'
        ? 'bg-emerald-500 text-white'
        : s === 'error'
        ? 'bg-red-500 text-white'
        : 'bg-brand text-white hover:bg-brand-hover'
    }`

  if (loadError) {
    return (
      <>
        <PageHeader title="Settings" showBack />
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <p className="text-sm text-muted text-center">{loadError}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Settings" showBack />

      <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
        {/* Profile section */}
        <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-full bg-surface-raised border border-border overflow-hidden flex items-center justify-center text-muted hover:opacity-80 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Upload avatar"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
              {/* Camera overlay */}
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarUpload}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Profile photo</p>
              <p className="text-xs text-muted">
                {status.avatar === 'saving' ? 'Uploading…' :
                 status.avatar === 'saved' ? 'Uploaded' :
                 status.avatar === 'error' ? 'Upload failed' :
                 'JPEG, PNG, or WebP'}
              </p>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-foreground mb-1.5">
              Display name
            </label>
            <input
              id="display_name"
              type="text"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="Your name"
              className={inputClass}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={status.profile === 'saving' || !profile}
              className={saveBtnClass(status.profile)}
            >
              {saveLabel(status.profile)}
            </button>
          </div>
        </section>

        {/* Location section */}
        <section className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Location</h2>
            <p className="text-xs text-muted mt-0.5">Used for weather-aware outfit suggestions</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lat" className="block text-sm font-medium text-foreground mb-1.5">
                Latitude
              </label>
              <input
                id="lat"
                type="number"
                step="any"
                value={form.location_lat}
                onChange={(e) => setForm((f) => ({ ...f, location_lat: e.target.value }))}
                placeholder="1.3521"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="lng" className="block text-sm font-medium text-foreground mb-1.5">
                Longitude
              </label>
              <input
                id="lng"
                type="number"
                step="any"
                value={form.location_lng}
                onChange={(e) => setForm((f) => ({ ...f, location_lng: e.target.value }))}
                placeholder="103.8198"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveLocation}
              disabled={status.location === 'saving' || !profile}
              className={saveBtnClass(status.location)}
            >
              {saveLabel(status.location)}
            </button>
          </div>
        </section>

        {/* VTO consent section */}
        <section className="bg-surface border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-foreground">Virtual Try-On consent</h2>
              <p className="text-xs text-muted mt-1">
                Allow your reference photo to be sent to Fashn.ai for photorealistic virtual try-on.
                Your photo is not stored by the AI provider.
              </p>
              {status.vto === 'saved' && (
                <p className="text-xs text-emerald-500 mt-1">Preference saved</p>
              )}
              {status.vto === 'error' && (
                <p className="text-xs text-red-500 mt-1">Could not save — try again</p>
              )}
            </div>

            {/* Toggle switch */}
            <button
              role="switch"
              aria-checked={form.vto_consent}
              aria-label="Virtual Try-On consent"
              onClick={() => saveVtoConsent(!form.vto_consent)}
              disabled={status.vto === 'saving' || !profile}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60 ${
                form.vto_consent ? 'bg-brand' : 'bg-border'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.vto_consent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Account section */}
        <section className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Account</h2>

          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-surface-raised transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Sign out
          </button>
        </section>

        {/* Danger zone */}
        <section className="bg-surface border border-red-200 dark:border-red-900 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
          <p className="text-xs text-muted">
            Permanently delete your account and all wardrobe data. This cannot be undone.
          </p>
          <Button
            variant="danger"
            size="md"
            className="w-full"
            onClick={() => {
              setDeleteConfirmText('')
              setDeleteError(null)
              setDeleteModalOpen(true)
            }}
            disabled={!profile}
          >
            Delete my account
          </Button>
        </section>
      </div>

      {/* Delete account confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete account"
        dismissible={!isDeleting}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            This will permanently delete all your garments, outfits, and data.
          </p>
          <p className="text-sm text-muted">
            Type <span className="font-semibold text-foreground">DELETE</span> to confirm.
          </p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            className={inputClass}
            disabled={isDeleting}
            autoComplete="off"
          />
          {deleteError && (
            <p className="text-xs text-red-500">{deleteError}</p>
          )}
          <div className="flex gap-3 justify-end pt-1">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={isDeleting}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              onClick={handleDeleteAccount}
            >
              Confirm delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
