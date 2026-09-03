/**
 * bulkInsertProducts.ts
 * -----------------------------------------------------------------------
 * Inserts validated Excel product rows into the authoritative database
 * (Neon Postgres products and inventory_products tables).
 * -----------------------------------------------------------------------
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ParsedProductRow } from './productExcelImport';
import { createProduct, DbProduct } from './products';

export interface BulkInsertOutcome {
  insertedCount: number;
  failedBatches: { rows: ParsedProductRow[]; error: string }[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80';

export async function bulkInsertProducts(
  _supabase?: SupabaseClient | any,
  validRows: ParsedProductRow[] = []
): Promise<BulkInsertOutcome> {
  const batches = chunk(validRows, 10);
  let insertedCount = 0;
  const failedBatches: BulkInsertOutcome['failedBatches'] = [];

  for (const batch of batches) {
    try {
      const results = await Promise.all(
        batch.map(async (row) => {
          const badges = [
            { id: 'rx', label: 'Rx Required', active: Boolean(row.badges.prescriptionRequired) },
            { id: 'cold_chain', label: 'Cold Chain (2°C-8°C)', active: Boolean(row.badges.coldChain) },
            { id: 'fast_delivery', label: '30-Min Fast Delivery', active: Boolean(row.badges.fastDelivery) },
            { id: 'genuine', label: '100% Genuine', active: Boolean(row.badges.genuineGuaranteed) },
            { id: 'best_seller', label: 'Best Seller', active: Boolean(row.badges.bestSeller) },
            { id: 'wholesale', label: 'Wholesale Pack', active: Boolean(row.badges.wholesaleBulkPack) },
          ];

          return createProduct({
            name: row.productName,
            subtitle: row.packSize || null,
            category_id: null, // createProduct resolves this by category_name
            category_name: row.category,
            brand: row.brand || 'Generic',
            sku: row.sku || null,
            hsn: row.hsnCode || '3004',
            mrp: row.mrp,
            customer_price: row.customerPrice,
            retailer_price: row.retailerPrice,
            discount_percent: row.customerOfferPercent || 0,
            stock: row.inventoryStock || 0,
            image_url: row.productImage || DEFAULT_IMG,
            details: row.packSize || null,
            is_flash_sale: Boolean(row.badges.flashSale),
            is_featured: Boolean(row.badges.featured),
            is_listed: row.listed !== false,
            badges,
          });
        })
      );

      const batchErrors = results.filter((r) => r.error);
      if (batchErrors.length > 0) {
        failedBatches.push({
          rows: batch,
          error: batchErrors.map((e) => e.error).join('; '),
        });
        insertedCount += batch.length - batchErrors.length;
      } else {
        insertedCount += batch.length;
      }
    } catch (err: any) {
      failedBatches.push({
        rows: batch,
        error: err?.message || 'Failed to insert batch',
      });
    }
  }

  return { insertedCount, failedBatches };
}
