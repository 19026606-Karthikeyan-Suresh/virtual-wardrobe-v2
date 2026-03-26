import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-5xl font-bold text-foreground">404</p>
      <p className="text-muted text-sm">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Go home
      </Link>
    </div>
  )
}
