/**
 * Calculates Cost-Per-Wear for a garment.
 *
 * @returns (purchasePrice + maintenanceCost) / timesWorn
 *          If timesWorn is 0, returns the full cost (not yet worn).
 *          Always rounded to 2 decimal places.
 */
export function calculateCPW(
  purchasePrice: number,
  maintenanceCost: number,
  timesWorn: number
): number {
  const total = purchasePrice + maintenanceCost
  if (timesWorn === 0) return Math.round(total * 100) / 100
  return Math.round((total / timesWorn) * 100) / 100
}
