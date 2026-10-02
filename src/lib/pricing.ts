/** Inclusive acre band with a fixed price for that band */
export interface PriceRange {
  minAcres: number;
  maxAcres: number;
  price: number;
}

export function normalizePriceRanges(ranges: unknown): PriceRange[] {
  if (!Array.isArray(ranges)) return [];
  return ranges
    .map((range) => ({
      minAcres: Number((range as PriceRange)?.minAcres),
      maxAcres: Number((range as PriceRange)?.maxAcres),
      price: Number((range as PriceRange)?.price),
    }))
    .filter(
      (range) =>
        Number.isFinite(range.minAcres) &&
        Number.isFinite(range.maxAcres) &&
        Number.isFinite(range.price)
    )
    .sort((a, b) => a.minAcres - b.minAcres);
}

export function startingPriceFromRanges(ranges: PriceRange[], fallback = 0): number {
  if (!ranges.length) return Number(fallback) || 0;
  return Math.min(...ranges.map((range) => range.price));
}

export function validatePriceRanges(ranges: PriceRange[]): string | null {
  if (!ranges.length) return 'Add at least one acre range';
  for (const range of ranges) {
    if (range.minAcres < 0 || range.maxAcres < 0) return 'Acres cannot be negative';
    if (range.minAcres > range.maxAcres) return 'Min acres cannot be greater than max acres';
    if (range.price < 0) return 'Price cannot be negative';
  }
  const sorted = [...ranges].sort((a, b) => a.minAcres - b.minAcres);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].minAcres < sorted[i - 1].maxAcres) {
      return 'Acre ranges cannot overlap';
    }
  }
  return null;
}

export function formatPriceRangeLabel(range: PriceRange): string {
  return `${range.minAcres}–${range.maxAcres} acres`;
}

export function rangeKey(minAcres: number, maxAcres: number): string {
  return `${minAcres}-${maxAcres}`;
}

/** serviceId -> fixed amount (legacy flat services only) */
export type SpecialPrices = Record<string, number>;

/** serviceId -> per-acre-band overrides */
export type SpecialPriceRanges = Record<string, PriceRange[]>;

export interface PricingTier {
  id: string;
  name: string;
  active: boolean;
  prices: SpecialPrices;
  priceRanges?: SpecialPriceRanges;
  consultancyAmount?: number | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPricing {
  pricingTierId?: string | null;
  specialPrices?: SpecialPrices;
  specialPriceRanges?: SpecialPriceRanges;
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

export function initRangeOverrideForm(
  services: { id: string; priceRanges?: PriceRange[] }[],
  existing?: SpecialPriceRanges
): Record<string, Record<string, string>> {
  const form: Record<string, Record<string, string>> = {};
  for (const service of services) {
    const ranges = normalizePriceRanges(service.priceRanges);
    if (!ranges.length) continue;
    form[service.id] = {};
    for (const band of ranges) {
      const key = rangeKey(band.minAcres, band.maxAcres);
      const saved = existing?.[service.id]?.find(
        (row) => row.minAcres === band.minAcres && row.maxAcres === band.maxAcres
      );
      form[service.id][key] = saved ? String(saved.price) : '';
    }
  }
  return form;
}

export function sanitizeSpecialPriceRanges(
  catalogByService: Record<string, PriceRange[]>,
  input: Record<string, Record<string, string>>
): SpecialPriceRanges {
  const result: SpecialPriceRanges = {};
  for (const [serviceId, bandInputs] of Object.entries(input)) {
    const catalog = catalogByService[serviceId] || [];
    const overrides: PriceRange[] = [];
    for (const band of catalog) {
      const key = rangeKey(band.minAcres, band.maxAcres);
      const raw = bandInputs[key];
      if (raw === undefined || raw === null || raw === '') continue;
      const price = Number(raw);
      if (Number.isNaN(price) || price < 0) continue;
      overrides.push({ minAcres: band.minAcres, maxAcres: band.maxAcres, price });
    }
    if (overrides.length) result[serviceId] = overrides;
  }
  return result;
}
