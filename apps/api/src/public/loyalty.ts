export interface LoyaltyTier {
  tier: 'Nuevo' | 'Bronce' | 'Plata' | 'Oro';
  discountPercent: number;
  visitsRequired: number;
  nextTier: { tier: string; visitsNeeded: number } | null;
}

const TIERS = [
  { tier: 'Oro' as const, discountPercent: 20, visitsRequired: 10 },
  { tier: 'Plata' as const, discountPercent: 15, visitsRequired: 6 },
  { tier: 'Bronce' as const, discountPercent: 10, visitsRequired: 3 },
];

export function getLoyaltyTier(totalVisits: number): LoyaltyTier {
  for (let i = 0; i < TIERS.length; i++) {
    const t = TIERS[i];
    if (totalVisits >= t.visitsRequired) {
      const next = i > 0 ? TIERS[i - 1] : null;
      return {
        tier: t.tier,
        discountPercent: t.discountPercent,
        visitsRequired: t.visitsRequired,
        nextTier: next ? { tier: next.tier, visitsNeeded: next.visitsRequired - totalVisits } : null,
      };
    }
  }
  const first = TIERS[TIERS.length - 1];
  return {
    tier: 'Nuevo',
    discountPercent: 0,
    visitsRequired: 0,
    nextTier: { tier: first.tier, visitsNeeded: first.visitsRequired - totalVisits },
  };
}
