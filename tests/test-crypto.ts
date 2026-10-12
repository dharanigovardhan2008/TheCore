import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptText, decryptText, generateVerifier, verifyPassword } from '../lib/crypto';

describe('Crypto Vault Suite', () => {
  it('generates verifier and verifies valid password', async () => {
    const password = 'my-super-secret-master-password';
    const verifier = await generateVerifier(password);
    const isValid = await verifyPassword(password, verifier);
    assert.strictEqual(isValid, true, 'Valid password should return true');
  });

  it('fails verifier check on wrong password', async () => {
    const password = 'my-super-secret-master-password';
    const verifier = await generateVerifier(password);
    const isInvalid = await verifyPassword('wrong-password', verifier);
    assert.strictEqual(isInvalid, false, 'Wrong password should return false');
  });

  it('encrypts and decrypts round-trip with correct password', async () => {
    const password = 'my-super-secret-master-password';
    const secretData = 'NEXT_PUBLIC_API_KEY=12345\nDB_PASS=secret';
    const encrypted = await encryptText(secretData, password);

    assert.ok(encrypted.ciphertext, 'Ciphertext should exist');
    assert.ok(encrypted.iv, 'IV should exist');
    assert.ok(encrypted.salt, 'Salt should exist');

    const decrypted = await decryptText(encrypted, password);
    assert.strictEqual(decrypted, secretData, 'Decrypted text should match original');
  });

  it('fails decryption on wrong password', async () => {
    const password = 'my-super-secret-master-password';
    const secretData = 'NEXT_PUBLIC_API_KEY=12345\nDB_PASS=secret';
    const encrypted = await encryptText(secretData, password);

    await assert.rejects(
      async () => {
        await decryptText(encrypted, 'wrong-password');
      },
      'Should throw an error when decrypting with wrong password'
    );
  });

  it('fails decryption on tampered data authentication check', async () => {
    const password = 'my-super-secret-master-password';
    const secretData = 'NEXT_PUBLIC_API_KEY=12345\nDB_PASS=secret';
    const encrypted = await encryptText(secretData, password);

    const tamperedEncrypted = { ...encrypted };
    const chars = tamperedEncrypted.ciphertext.split('');
    chars[0] = chars[0] === 'A' ? 'B' : 'A';
    tamperedEncrypted.ciphertext = chars.join('');

    await assert.rejects(
      async () => {
        await decryptText(tamperedEncrypted, password);
      },
      'Should throw an error for tampered data'
    );
  });
});
