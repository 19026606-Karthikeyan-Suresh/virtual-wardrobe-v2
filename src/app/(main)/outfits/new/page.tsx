import PageHeader from '@/components/layout/PageHeader'
import { LookbookCanvas } from '@/features/outfits/LookbookCanvas'

export default function NewOutfitPage() {
  return (
    <>
      <PageHeader title="New Outfit" showBack />
      <div className="px-4 py-4">
        <LookbookCanvas />
      </div>
    </>
  )
}
