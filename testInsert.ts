import { bulkInsertProducts } from './src/lib/bulkInsertProducts';
import { ParsedProductRow } from './src/lib/productExcelImport';

const validRows: ParsedProductRow[] = [
  {
    rowNumber: 2,
    productImage: '',
    imageUrls: [],
    productName: 'Valid Product 1',
    packSize: '10s',
    category: 'Medicines',
    brand: 'BrandX',
    sku: `TEST-SKU-1-${Date.now()}`,
    hsnCode: '3004',
    mrp: 100,
    retailerPrice: 80,
    retailerOfferPercent: 20,
    retailerMarginPercent: 20,
    inventoryStock: 10,
    listed: true,
    badges: {
      featured: false,
      prescriptionRequired: false,
      coldChain: false,
      bestSeller: false,
      genuineGuaranteed: true,
      fastDelivery: true,
      flashSale: false,
      wholesaleBulkPack: false,
    },
    warnings: [],
    errors: [],
    isValid: true,
  },
  {
    rowNumber: 3,
    productImage: '',
    imageUrls: [],
    productName: 'Duplicate SKU Product',
    packSize: '10s',
    category: 'Medicines',
    brand: 'BrandX',
    sku: `TEST-SKU-1-${Date.now()}`, // Intentional duplicate SKU to cause Postgres error
    hsnCode: '3004',
    mrp: 100,
    retailerPrice: 80,
    retailerOfferPercent: 20,
    retailerMarginPercent: 20,
    inventoryStock: 10,
    listed: true,
    badges: {
      featured: false,
      prescriptionRequired: false,
      coldChain: false,
      bestSeller: false,
      genuineGuaranteed: true,
      fastDelivery: true,
      flashSale: false,
      wholesaleBulkPack: false,
    },
    warnings: [],
    errors: [],
    isValid: true,
  },
  {
    rowNumber: 4,
    productImage: '',
    imageUrls: [],
    productName: 'Valid Product 2',
    packSize: '10s',
    category: 'Medicines',
    brand: 'BrandX',
    sku: `TEST-SKU-2-${Date.now()}`,
    hsnCode: '3004',
    mrp: 100,
    retailerPrice: 80,
    retailerOfferPercent: 20,
    retailerMarginPercent: 20,
    inventoryStock: 10,
    listed: true,
    badges: {
      featured: false,
      prescriptionRequired: false,
      coldChain: false,
      bestSeller: false,
      genuineGuaranteed: true,
      fastDelivery: true,
      flashSale: false,
      wholesaleBulkPack: false,
    },
    warnings: [],
    errors: [],
    isValid: true,
  }
];

async function run() {
  console.log('Testing bulkInsertProducts...');
  const outcome = await bulkInsertProducts(undefined, validRows);
  console.log('Inserted Count:', outcome.insertedCount);
  console.log('Failed Rows:', outcome.failedRows);
}

run().catch(console.error);
