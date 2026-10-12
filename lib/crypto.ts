// We use the Web Crypto API which is available in modern browsers and Node.js >= 19.

const ITERATIONS = 250000;
const ALGORITHM = "AES-GCM";
const HASH = "SHA-256";

export interface EncryptedData {
  ciphertext: string; // base64
  iv: string;         // base64
  salt: string;       // base64
  iterations: number;
}

export interface VaultVerifier {
  salt: string;       // base64
  iterations: number;
  encrypted_challenge: string; // base64
  iv: string;         // base64
}

const CHALLENGE_TEXT = "PROJECT_VAULT_AUTH_CHALLENGE_STRING_VERY_SECRET";

// Utility: ArrayBuffer to Base64
export function bufferToBase64(buffer: any): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility: Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a CryptoKey from a password and salt using PBKDF2.
 */
export async function deriveKey(password: string, saltBuffer: any, iterations: number = ITERATIONS): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations,
      hash: HASH,
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generates a verifier object for a new master password.
 */
export async function generateVerifier(password: string): Promise<VaultVerifier> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, ITERATIONS);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(CHALLENGE_TEXT)
  );

  return {
    salt: bufferToBase64(salt),
    iterations: ITERATIONS,
    encrypted_challenge: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv)
  };
}

/**
 * Verifies a password against a stored verifier object.
 * Returns true if successful, false if incorrect.
 */
export async function verifyPassword(password: string, verifier: VaultVerifier): Promise<boolean> {
  try {
    const saltBuffer = base64ToBuffer(verifier.salt);
    const key = await deriveKey(password, saltBuffer, verifier.iterations);
    
    const ivBuffer = base64ToBuffer(verifier.iv);
    const ciphertextBuffer = base64ToBuffer(verifier.encrypted_challenge);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: ivBuffer },
      key,
      ciphertextBuffer
    );
    
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer) === CHALLENGE_TEXT;
  } catch (e) {
    // Decryption failure (e.g. wrong password causing AES-GCM auth tag check to fail)
    return false;
  }
}

/**
 * Encrypts arbitrary text using a password, generating a new random salt.
 */
export async function encryptText(text: string, password: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, ITERATIONS);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const enc = new TextEncoder();
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(text)
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    iterations: ITERATIONS
  };
}

/**
 * Decrypts text using the password and the record's specific salt.
 */
export async function decryptText(encrypted: EncryptedData, password: string): Promise<string> {
  const saltBuffer = base64ToBuffer(encrypted.salt);
  const key = await deriveKey(password, saltBuffer, encrypted.iterations || ITERATIONS);

  const ivBuffer = base64ToBuffer(encrypted.iv);
  const ciphertextBuffer = base64ToBuffer(encrypted.ciphertext);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBuffer },
    key,
    ciphertextBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
