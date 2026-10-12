import { encryptText, decryptText, generateVerifier, verifyPassword } from './lib/crypto';
import assert from 'assert';

async function runTests() {
  console.log("Starting Crypto Tests...");

  // 1. Verifier generation and password checking
  console.log("Test 1: Verifier generation and successful check");
  const password = "my-super-secret-master-password";
  const verifier = await generateVerifier(password);
  
  const isValid = await verifyPassword(password, verifier);
  assert.strictEqual(isValid, true, "Valid password should return true");

  console.log("Test 2: Verifier fails on wrong password");
  const isInvalid = await verifyPassword("wrong-password", verifier);
  assert.strictEqual(isInvalid, false, "Wrong password should return false");

  // 2. Encryption and Decryption Round Trip
  console.log("Test 3: Encrypt then decrypt round trip");
  const secretData = "NEXT_PUBLIC_API_KEY=12345\nDB_PASS=secret";
  const encrypted = await encryptText(secretData, password);
  
  assert.ok(encrypted.ciphertext, "Ciphertext should exist");
  assert.ok(encrypted.iv, "IV should exist");
  assert.ok(encrypted.salt, "Salt should exist");
  
  const decrypted = await decryptText(encrypted, password);
  assert.strictEqual(decrypted, secretData, "Decrypted text should match original");

  // 3. Decryption fails on wrong password
  console.log("Test 4: Decryption fails with wrong password");
  try {
    await decryptText(encrypted, "wrong-password");
    assert.fail("Should have thrown an error during decryption");
  } catch (e) {
    assert.ok(true, "Threw error as expected when decrypting with wrong password");
  }

  // 4. Tampered Data fails
  console.log("Test 5: Tampered data fails authentication tag check");
  const tamperedEncrypted = { ...encrypted };
  // Modify ciphertext slightly
  const chars = tamperedEncrypted.ciphertext.split('');
  chars[0] = chars[0] === 'A' ? 'B' : 'A';
  tamperedEncrypted.ciphertext = chars.join('');
  
  try {
    await decryptText(tamperedEncrypted, password);
    assert.fail("Should have thrown an error for tampered data");
  } catch (e) {
    assert.ok(true, "Threw error as expected when decrypting tampered data");
  }

  console.log("✅ All crypto tests passed successfully!");
}

runTests().catch(console.error);
