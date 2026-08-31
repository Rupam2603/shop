import { createNeonUser, authenticateNeonUser } from './src/lib/users.js';
// mock import.meta.env for neon.ts
(globalThis as any).import = { meta: { env: { VITE_NEON_DATABASE_URL: process.env.DATABASE_URL } } };

async function test() {
  const email = 'test_customer_' + Date.now() + '@example.com';
  const pass = 'password123';
  console.log('1. Signing up', email);
  const signupResult = await createNeonUser({ email, password: pass, fullName: 'Test', role: 'customer' });
  console.log('Signup result:', signupResult.success);

  console.log('3. Logging in manually');
  const loginResult = await authenticateNeonUser(email, pass);
  console.log('Login result:', loginResult);
}
test().catch(console.error);
