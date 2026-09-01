import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
async function run() {
    try {
        const res = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'`;
        console.log("PROFILES:");
        console.log(res);
        const res2 = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`;
        console.log("USERS:");
        console.log(res2);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
