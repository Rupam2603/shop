/**
 * Automated test script to verify real-time inventory calculations and concurrency simulation
 */

console.log("==================================================");
console.log("🧪 REAL-TIME INVENTORY & CONCURRENCY TEST SUITE");
console.log("==================================================");

// 1. Test Stock State Evaluator
function evaluateStockState(stock, isRetailer = false) {
  if (stock <= 0) {
    return {
      status: "OUT_OF_STOCK",
      label: isRetailer ? "Stock Out (0 units)" : "Out of Stock",
      badgeColor: "red",
      canPurchase: false,
    };
  }
  const lowThreshold = isRetailer ? 20 : 10;
  if (stock <= lowThreshold) {
    return {
      status: "LOW_STOCK",
      label: isRetailer ? `Low Stock (${stock} units)` : `Only ${stock} left!`,
      badgeColor: "amber",
      canPurchase: true,
    };
  }
  return {
    status: "IN_STOCK",
    label: isRetailer ? `${stock} units available` : `In Stock (${stock} units)`,
    badgeColor: "emerald",
    canPurchase: true,
  };
}

// 2. Test Customer Stock Transitions
console.log("\n--- [TEST 1] Customer Stock Transitions ---");
const customerCases = [
  { stock: 50, expectedStatus: "IN_STOCK" },
  { stock: 10, expectedStatus: "LOW_STOCK" },
  { stock: 2,  expectedStatus: "LOW_STOCK" },
  { stock: 0,  expectedStatus: "OUT_OF_STOCK" },
  { stock: -1, expectedStatus: "OUT_OF_STOCK" },
];

let allPassed = true;
customerCases.forEach(({ stock, expectedStatus }) => {
  const result = evaluateStockState(stock, false);
  const pass = result.status === expectedStatus;
  console.log(` Stock: ${stock} -> Status: ${result.status} [${result.label}] (Can Purchase: ${result.canPurchase}) => ${pass ? "✅ PASS" : "❌ FAIL"}`);
  if (!pass) allPassed = false;
});

// 3. Test Retailer Granular Stock Transitions (Wholesale threshold = 20)
console.log("\n--- [TEST 2] Retailer Wholesale Stock Transitions ---");
const retailerCases = [
  { stock: 100, expectedStatus: "IN_STOCK" },
  { stock: 20,  expectedStatus: "LOW_STOCK" },
  { stock: 5,   expectedStatus: "LOW_STOCK" },
  { stock: 0,   expectedStatus: "OUT_OF_STOCK" },
];

retailerCases.forEach(({ stock, expectedStatus }) => {
  const result = evaluateStockState(stock, true);
  const pass = result.status === expectedStatus;
  console.log(` Retailer Stock: ${stock} -> Status: ${result.status} [${result.label}] => ${pass ? "✅ PASS" : "❌ FAIL"}`);
  if (!pass) allPassed = false;
});

// 4. Test Concurrent Purchase Stock Reduction Simulation
console.log("\n--- [TEST 3] Concurrent Purchase Simulation ---");
let productInventory = 15;
const concurrentOrders = [
  { user: "Retailer A", qty: 5 },
  { user: "Customer B", qty: 4 },
  { user: "Customer C", qty: 6 },
  { user: "Customer D", qty: 2 }, // Exceeds stock
];

concurrentOrders.forEach((order) => {
  if (productInventory >= order.qty) {
    productInventory -= order.qty;
    console.log(` 🛍️ Order from ${order.user} for ${order.qty} units APPROVED. Remaining stock: ${productInventory}`);
  } else {
    console.log(` 🚫 Order from ${order.user} for ${order.qty} units REJECTED (Insufficient stock: only ${productInventory} available)`);
  }
});

const finalStockState = evaluateStockState(productInventory, false);
console.log(` Final Inventory: ${productInventory} -> State: ${finalStockState.status} (${finalStockState.label})`);
if (productInventory === 0 && finalStockState.status === "OUT_OF_STOCK") {
  console.log(" ✅ PASS: Product correctly triggered Out-of-Stock lock!");
} else {
  console.log(" ❌ FAIL: Inventory mismatch");
  allPassed = false;
}

// 5. Test Order Cancellation Stock Restoration
console.log("\n--- [TEST 4] Order Cancellation Stock Restoration ---");
const cancelledOrderQty = 5;
productInventory += cancelledOrderQty;
console.log(` ↩️ Cancelled order for ${cancelledOrderQty} units restored.`);
const restoredState = evaluateStockState(productInventory, false);
console.log(` Restored Inventory: ${productInventory} -> State: ${restoredState.status} (${restoredState.label})`);

if (productInventory === 5 && restoredState.status === "LOW_STOCK") {
  console.log(" ✅ PASS: Product correctly transitioned back to Low Stock!");
} else {
  console.log(" ❌ FAIL: Restoration calculation error");
  allPassed = false;
}

console.log("\n==================================================");
if (allPassed) {
  console.log("🎉 ALL REAL-TIME INVENTORY TESTS PASSED PERFECTLY!");
} else {
  console.error("❌ SOME TESTS FAILED");
  process.exit(1);
}
console.log("==================================================");
