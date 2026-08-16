/** serviceId -> fixed amount */
export type SpecialPrices = Record<string, number>;

export interface PricingTier {
  id: string;
  name: string;
  active: boolean;
  prices: SpecialPrices;
  consultancyAmount?: number | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPricing {
  pricingTierId?: string | null;
  specialPrices?: SpecialPrices;
  consultancySpecialAmount?: number | null;
}

function hasOverride(value: unknown): value is number {
  return value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value));
}

/** User override → tier → general catalog price */
export function resolveServicePrice(
  serviceId: string,
  generalPrice: number,
  user?: UserPricing | null,
  tier?: PricingTier | null
): number {
  if (user?.specialPrices && hasOverride(user.specialPrices[serviceId])) {
    return Number(user.specialPrices[serviceId]);
  }
  if (tier && tier.active !== false && hasOverride(tier.prices?.[serviceId])) {
    return Number(tier.prices[serviceId]);
  }
  return Number(generalPrice) || 0;
}

export function resolveConsultancyPrice(
  generalAmount: number,
  user?: UserPricing | null,
  tier?: PricingTier | null
): number {
  if (hasOverride(user?.consultancySpecialAmount)) {
    return Number(user!.consultancySpecialAmount);
  }
  if (tier && tier.active !== false && hasOverride(tier.consultancyAmount)) {
    return Number(tier.consultancyAmount);
  }
  return Number(generalAmount) || 0;
}

/** Strip empty / invalid entries from a price map */
export function sanitizeSpecialPrices(
  input: Record<string, string | number | undefined | null>
): SpecialPrices {
  const result: SpecialPrices = {};
  for (const [serviceId, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '') continue;
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) continue;
    result[serviceId] = num;
  }
  return result;
}
