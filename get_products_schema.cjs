require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.VITE_NEON_DATABASE_URL);
async function run() {
  try {
    const products = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'`;
    console.log('Products:', products);
    
    const inv = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'inventory_products'`;
    console.log('Inventory:', inv);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
