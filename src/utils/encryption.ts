/**
 * Encrypted localStorage utility
 * Uses browser's Web Crypto API for AES-GCM encryption
 */

// Generate a key from a password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Get or create a device-specific encryption key
function getDeviceKey(): string {
  const storageKey = '__device_key__'
  let deviceKey = localStorage.getItem(storageKey)

  if (!deviceKey) {
    // Generate a random device key on first use
    const randomBytes = crypto.getRandomValues(new Uint8Array(32))
    deviceKey = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(storageKey, deviceKey)
  }

  return deviceKey
}

/**
 * Encrypt data using AES-GCM
 */
async function encrypt(plaintext: string): Promise<string> {
  try {
    const deviceKey = getDeviceKey()
    const encoder = new TextEncoder()

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Derive encryption key
    const key = await deriveKey(deviceKey, salt)

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(plaintext)
    )

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encrypted), salt.length + iv.length)

    // Convert to base64
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data using AES-GCM
 */
async function decrypt(ciphertext: string): Promise<string> {
  try {
    const deviceKey = getDeviceKey()
    const decoder = new TextDecoder()

    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const encrypted = combined.slice(28)

    // Derive decryption key
    const key = await deriveKey(deviceKey, salt)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )

    return decoder.decode(decrypted)
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Securely store data in localStorage with encryption
 */
export async function secureSetItem(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const encrypted = await encrypt(value)
    localStorage.setItem(`enc_${key}`, encrypted)
  } catch (error) {
    console.error(`Failed to securely store ${key}:`, error)
    // Fallback to unencrypted storage
    localStorage.setItem(key, value)
  }
}

/**
 * Retrieve and decrypt data from localStorage
 */
export async function secureGetItem(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    // Try encrypted version first
    const encrypted = localStorage.getItem(`enc_${key}`)
    if (encrypted) {
      return await decrypt(encrypted)
    }

    // Fallback to unencrypted version (for backward compatibility)
    return localStorage.getItem(key)
  } catch (error) {
    console.error(`Failed to securely retrieve ${key}:`, error)
    // Fallback to unencrypted version
    return localStorage.getItem(key)
  }
}

/**
 * Remove data from localStorage (both encrypted and unencrypted)
 */
export function secureRemoveItem(key: string): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(`enc_${key}`)
  localStorage.removeItem(key)
}

/**
 * Migrate existing unencrypted data to encrypted storage
 */
export async function migrateToEncrypted(key: string): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    const unencrypted = localStorage.getItem(key)
    if (unencrypted && !localStorage.getItem(`enc_${key}`)) {
      await secureSetItem(key, unencrypted)
      // Keep unencrypted version for now (can be removed after migration period)
      // localStorage.removeItem(key)
    }
  } catch (error) {
    console.error(`Failed to migrate ${key}:`, error)
  }
}

/**
 * Check if Web Crypto API is available
 */
export function isEncryptionAvailable(): boolean {
  return typeof window !== 'undefined' &&
         typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined'
}
