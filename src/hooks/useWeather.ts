'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentWeather } from '@/lib/weather/open-meteo'
import { useAuthStore } from '@/stores/authStore'

interface WeatherResult {
  temp_c: number
  condition: string
}

async function fetchWeather(userId: string): Promise<WeatherResult | null> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('location_lat, location_lng')
    .eq('id', userId)
    .single()

  if (!profile?.location_lat || !profile?.location_lng) {
    return null
  }

  return getCurrentWeather(
    profile.location_lat as number,
    profile.location_lng as number,
  )
}

export function useWeather() {
  const user = useAuthStore((s) => s.user)

  return useQuery({
    queryKey: ['weather', user?.id],
    queryFn: () => fetchWeather(user!.id),
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
