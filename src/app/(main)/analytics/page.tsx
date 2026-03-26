'use client'

import PageHeader from '@/components/layout/PageHeader'
import { StatsHeader } from '@/features/analytics/StatsHeader'
import { CPWTable } from '@/features/analytics/CPWTable'
import { ColourChart } from '@/features/analytics/ColourChart'
import { CategoryChart } from '@/features/analytics/CategoryChart'
import { SleepingItems } from '@/features/analytics/SleepingItems'

function SectionDivider() {
  return <hr className="border-border" />
}

export default function AnalyticsPage() {
  return (
    <div className="pb-8">
      <PageHeader title="Analytics" />

      <div className="px-4 py-5 flex flex-col gap-6">
        {/* Summary stats */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Overview
          </h2>
          <StatsHeader />
        </section>

        <SectionDivider />

        {/* CPW table */}
        <section aria-labelledby="cpw-heading">
          <h2 id="cpw-heading" className="text-base font-semibold text-foreground mb-3">
            Cost per wear
          </h2>
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <CPWTable />
          </div>
        </section>

        <SectionDivider />

        {/* Charts — side by side on md+, stacked on mobile */}
        <section aria-labelledby="charts-heading">
          <h2 id="charts-heading" className="text-base font-semibold text-foreground mb-4">
            Wardrobe breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Colour donut */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <h3 className="text-sm font-medium text-muted mb-3">Colour palette</h3>
              <ColourChart />
            </div>

            {/* Category bars */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <h3 className="text-sm font-medium text-muted mb-3">By category</h3>
              <CategoryChart />
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* Sleeping items */}
        <section aria-labelledby="sleeping-heading">
          <SleepingItems />
        </section>
      </div>
    </div>
  )
}
