/**
 * bulkInsertProducts.ts
 * -----------------------------------------------------------------------
 * Inserts validated Excel product rows into the authoritative database
 * (Neon Postgres products and inventory_products tables).
 * -----------------------------------------------------------------------
 */

import { ParsedProductRow } from './productExcelImport';
import { createProduct, DbProduct } from './products';

export interface BulkInsertOutcome {
  insertedCount: number;
  failedRows: { rowNumber: number; productName: string; error: string }[];
}

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80';

export async function bulkInsertProducts(
  _supabase?: any,
  validRows: ParsedProductRow[] = []
): Promise<BulkInsertOutcome> {
  let insertedCount = 0;
  const failedRows: BulkInsertOutcome['failedRows'] = [];

  for (const row of validRows) {
    try {
      const badges = [
        { id: 'rx', label: 'Rx Required', active: Boolean(row.badges.prescriptionRequired) },
        { id: 'cold_chain', label: 'Cold Chain (2°C-8°C)', active: Boolean(row.badges.coldChain) },
        { id: 'fast_delivery', label: '30-Min Fast Delivery', active: Boolean(row.badges.fastDelivery) },
        { id: 'genuine', label: '100% Genuine', active: Boolean(row.badges.genuineGuaranteed) },
        { id: 'best_seller', label: 'Best Seller', active: Boolean(row.badges.bestSeller) },
        { id: 'wholesale', label: 'Wholesale Pack', active: Boolean(row.badges.wholesaleBulkPack) },
      ];

      const { data, error } = await createProduct({
        name: row.productName,
        subtitle: row.packSize || null,
        category_id: null,
        category_name: row.category,
        brand: row.brand || 'Generic',
        sku: row.sku || null,
        hsn: row.hsnCode || '3004',
        mrp: row.mrp,
        customer_price: row.mrp,
        retailer_price: row.retailerPrice,
        discount_percent: 0,
        retailer_discount_percent: 0,
        stock: row.inventoryStock || 0,
        image_url: row.productImage || DEFAULT_IMG,
        details: row.packSize || null,
        is_flash_sale: Boolean(row.badges.flashSale),
        is_featured: Boolean(row.badges.featured),
        is_listed: row.listed !== false,
        badges,
      });

      if (error || !data) {
        failedRows.push({
          rowNumber: row.rowNumber,
          productName: row.productName,
          error: error || 'Unknown database error',
        });
      } else {
        insertedCount++;
      }
    } catch (err: any) {
      failedRows.push({
        rowNumber: row.rowNumber,
        productName: row.productName,
        error: err?.message || 'Failed to insert row',
      });
    }
  }

  return { insertedCount, failedRows };
}
