/**
 * pricing.ts
 * -----------------------------------------------------------------------
 * Single source of truth for discount math, shared by:
 *   - ProductModal (manual "Add New Pharmaceutical Product" form)
 *   - Bulk Excel import
 *
 * Both discount percentages are baselined off MRP, so they're directly
 * comparable. Retailer margin over the customer price is a separate,
 * clearly-labeled figure — never conflated with "discount".
 * -----------------------------------------------------------------------
 */

export interface PricingInput {
  mrp: number;
  customerPrice: number;
  retailerPrice: number;
}

export interface PricingResult {
  /** % off MRP shown to customers */
  customerOfferPercent: number | null;
  /** % off MRP shown to retailers — same baseline as customerOfferPercent */
  retailerOfferPercent: number | null;
  /** Retailer's extra margin over the customer price (NOT a discount) */
  retailerMarginPercent: number | null;
}

function pctOff(baseline: number, price: number): number | null {
  if (!baseline || baseline <= 0) return null;
  if (price >= baseline) return null; // no discount to show
  return Math.round(((baseline - price) / baseline) * 100);
}

export function calculatePricing({
  mrp,
  customerPrice,
  retailerPrice,
}: PricingInput): PricingResult {
  const customerOfferPercent = pctOff(mrp, customerPrice);
  const retailerOfferPercent = pctOff(mrp, retailerPrice);

  let retailerMarginPercent: number | null = null;
  if (customerPrice > 0 && retailerPrice < customerPrice) {
    retailerMarginPercent = Math.round(
      ((customerPrice - retailerPrice) / customerPrice) * 100
    );
  }

  return { customerOfferPercent, retailerOfferPercent, retailerMarginPercent };
}

/** Basic sanity checks used to flag (not necessarily block) a row */
export function getPricingWarnings(input: PricingInput): string[] {
  const warnings: string[] = [];
  const { mrp, customerPrice, retailerPrice } = input;

  if (mrp <= 0) warnings.push('MRP must be greater than 0');
  if (customerPrice <= 0) warnings.push('Customer price must be greater than 0');
  if (retailerPrice <= 0) warnings.push('Retailer price must be greater than 0');
  if (customerPrice > mrp) warnings.push('Customer price is higher than MRP');
  if (retailerPrice > mrp) warnings.push('Retailer price is higher than MRP');
  if (retailerPrice > customerPrice) {
    warnings.push('Retailer price is higher than customer price (unusual for wholesale)');
  }

  return warnings;
}
