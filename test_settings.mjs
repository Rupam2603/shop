import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function run() {
    try {
        const res = await sql`SELECT * FROM store_settings LIMIT 1`;
        console.log(res);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
