// Zero-trust encryption utilities for LockingMiNDS vault
// All sensitive vault data must be encrypted client-side before storage/transmission
// Uses AES-GCM with PBKDF2 key derivation for maximum security

export interface VaultEntryData {
  name: string;
  url?: string;
  username?: string;
  password?: string;
  type: "login" | "payment";
  twoFA?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

export interface EncryptedVaultEntry {
  id: string;
  type: "login" | "payment";
  encryptedData: string;
  iv: string;
  salt: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12, // 96 bits for AES-GCM
  saltLength: 16, // 128 bits
  tagLength: 128, // 128 bits for authentication tag
  iterations: 100000, // PBKDF2 iterations
  version: 'v1'
};

/**
 * Derive cryptographic key from master password using PBKDF2
 * @param password - User's master password
 * @param email - User's email (additional entropy)
 * @param salt - Random salt for key derivation
 * @returns Promise<CryptoKey> - Derived AES key
 */
async function deriveKey(password: string, email: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password + email);
  
  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive AES-GCM key using PBKDF2
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ENCRYPTION_CONFIG.iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate cryptographically secure random bytes
 * @param length - Number of bytes to generate
 * @returns Uint8Array - Random bytes
 */
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert Uint8Array to base64 string
 * @param bytes - Byte array to convert
 * @returns string - Base64 encoded string
 */
function bytesToBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
}

/**
 * Convert base64 string to Uint8Array
 * @param base64 - Base64 encoded string
 * @returns Uint8Array - Decoded byte array
 */
function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
}

/**
 * Encrypt vault entry data using AES-GCM
 * @param data - Vault entry data to encrypt
 * @param masterPassword - User's master password
 * @param email - User's email for additional entropy
 * @param salt - Optional salt for key derivation (if not provided, generates random)
 * @returns Promise<{encryptedData: string, salt: string, iv: string}> - Encrypted data with actual salt/iv used
 */
export async function encryptVaultEntry(
  data: VaultEntryData, 
  masterPassword: string, 
  email: string,
  salt?: Uint8Array
): Promise<{encryptedData: string, salt: string, iv: string}> {
  try {
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));
    
    // Generate random salt and IV (or use provided salt)
    const actualSalt = salt || generateRandomBytes(ENCRYPTION_CONFIG.saltLength);
    const iv = generateRandomBytes(ENCRYPTION_CONFIG.ivLength);
    
    // Derive encryption key from FULL master password and email with salt
    const cryptoKey = await deriveKey(masterPassword, email, actualSalt);
    
    // Encrypt the data using AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv,
        tagLength: ENCRYPTION_CONFIG.tagLength
      },
      cryptoKey,
      plaintext
    );
    
    // Combine salt, iv, and encrypted data
    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(actualSalt.length + iv.length + encryptedArray.length);
    combined.set(actualSalt, 0);
    combined.set(iv, actualSalt.length);
    combined.set(encryptedArray, actualSalt.length + iv.length);
    
    return {
      encryptedData: bytesToBase64(combined),
      salt: bytesToBase64(actualSalt),
      iv: bytesToBase64(iv)
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt vault entry');
  }
}

/**
 * Decrypt vault entry data using AES-GCM
 * @param encryptedData - Base64 encoded encrypted data (contains salt, iv, and encrypted data)
 * @param masterPassword - User's master password
 * @param email - User's email for additional entropy
 * @returns Promise<VaultEntryData | null> - Decrypted vault entry data or null on failure
 */
export async function decryptVaultEntry(
  encryptedData: string, 
  masterPassword: string, 
  email: string
): Promise<VaultEntryData | null> {
  try {
    const combined = base64ToBytes(encryptedData);
    
    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, ENCRYPTION_CONFIG.saltLength);
    const iv = combined.slice(ENCRYPTION_CONFIG.saltLength, ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength);
    const encrypted = combined.slice(ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength);
    
    // Derive decryption key from FULL master password and email with salt
    const cryptoKey = await deriveKey(masterPassword, email, salt);
    
    // Decrypt the data using AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        iv: iv,
        tagLength: ENCRYPTION_CONFIG.tagLength
      },
      cryptoKey,
      encrypted
    );
    
    // Convert decrypted data back to string and parse JSON
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decrypted);
    return JSON.parse(jsonString);
    
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/**
 * DEPRECATED: This function had severe security vulnerabilities (only 32-bit entropy)
 * Now we pass master password directly to PBKDF2 functions for proper cryptographic security
 * @deprecated Use master password directly in encryption/decryption functions
 * @param password - Master password
 * @param email - User email for additional entropy
 * @returns string - The master password (no longer derives weak key)
 */
export function deriveUserKey(password: string, email: string): string {
  console.warn('deriveUserKey is deprecated - using master password directly for PBKDF2');
  // Return the master password directly - the real security comes from PBKDF2 with salt
  return password;
}

/**
 * PLACEHOLDER: Generate zero-knowledge proof for authentication
 * TODO: Replace with proper cryptographic zero-knowledge proof
 * This is NOT a real ZK proof - just a placeholder for authentication
 * @param password - User's master password
 * @param salt - Random salt for proof generation
 * @returns string - Authentication token (NOT a real ZK proof)
 */
export function generateZKProof(password: string, salt: string): string {
  console.warn('generateZKProof is a placeholder - not a real zero-knowledge proof');
  const combined = password + salt + Date.now();
  const hash = btoa(combined).substring(0, 32);
  return hash;
}

/**
 * Create encrypted vault entry with proper structure
 * @param data - Vault entry data to encrypt
 * @param masterPassword - User's master password
 * @param email - User's email for additional entropy
 * @param id - Optional entry ID
 * @returns Promise<EncryptedVaultEntry> - Encrypted entry ready for storage
 */
export async function createEncryptedVaultEntry(
  data: VaultEntryData,
  masterPassword: string,
  email: string,
  id?: string
): Promise<EncryptedVaultEntry> {
  // Use the new encryption function that returns actual salt/iv used
  const encryptionResult = await encryptVaultEntry(data, masterPassword, email);
  
  return {
    id: id || Date.now().toString(),
    type: data.type,
    encryptedData: encryptionResult.encryptedData,
    iv: encryptionResult.iv,
    salt: encryptionResult.salt,
    version: ENCRYPTION_CONFIG.version,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Decrypt vault entry for display purposes
 * Only decrypts in memory, never persists plaintext
 * @param encryptedEntry - Encrypted vault entry
 * @param masterPassword - User's master password
 * @param email - User's email for additional entropy
 * @returns Promise<(VaultEntryData & { id: string }) | null> - Decrypted entry or null on failure
 */
export async function getDecryptedVaultEntry(
  encryptedEntry: EncryptedVaultEntry,
  masterPassword: string,
  email: string
): Promise<(VaultEntryData & { id: string }) | null> {
  try {
    const decryptedData = await decryptVaultEntry(encryptedEntry.encryptedData, masterPassword, email);
    if (!decryptedData) {
      return null;
    }
    
    return {
      ...decryptedData,
      id: encryptedEntry.id
    };
  } catch (error) {
    console.error('Failed to decrypt vault entry:', error);
    return null;
  }
}

/**
 * Validate encrypted vault entry structure
 * @param entry - Entry to validate
 * @returns boolean - True if entry has valid structure
 */
export function isValidEncryptedEntry(entry: any): entry is EncryptedVaultEntry {
  return (
    entry &&
    typeof entry.id === 'string' &&
    typeof entry.type === 'string' &&
    typeof entry.encryptedData === 'string' &&
    typeof entry.iv === 'string' &&
    typeof entry.salt === 'string' &&
    typeof entry.version === 'string' &&
    (entry.type === 'login' || entry.type === 'payment')
  );
}