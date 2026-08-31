import { hashPasswordWithSalt, verifyPasswordHash } from './src/lib/users.js';

async function run() {
  const password = "mySecurePassword123";
  const { hash, salt } = await hashPasswordWithSalt(password);
  console.log("Hash:", hash);
  console.log("Salt:", salt);

  const isValid = await verifyPasswordHash(password, hash);
  console.log("Is valid with correct password?", isValid);

  const isInvalid = await verifyPasswordHash("wrongPassword", hash);
  console.log("Is valid with wrong password?", isInvalid);
}

run().catch(console.error);
