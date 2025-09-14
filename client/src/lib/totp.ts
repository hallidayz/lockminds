// TOTP (Time-based One-Time Password) implementation
// RFC 6238 compliant TOTP generator for cross-platform MFA

export interface TOTPEntry {
  id: string;
  accountName: string;
  email: string;
  secret: string;
  issuer?: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: 6 | 8;
  period?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TOTPCode {
  code: string;
  timeRemaining: number;
  progress: number; // 0-100
}

export class TOTPGenerator {
  private static readonly DEFAULT_ALGORITHM = 'SHA1';
  private static readonly DEFAULT_DIGITS = 6;
  private static readonly DEFAULT_PERIOD = 30; // 30 seconds
  private static readonly WINDOW_SIZE = 1; // Allow 1 time step variance

  /**
   * Generate a TOTP code for the given secret
   */
  static async generateTOTP(entry: TOTPEntry): Promise<TOTPCode> {
    const algorithm = entry.algorithm || this.DEFAULT_ALGORITHM;
    const digits = entry.digits || this.DEFAULT_DIGITS;
    const period = entry.period || this.DEFAULT_PERIOD;
    
    // Get current time step
    const timeStep = Math.floor(Date.now() / 1000 / period);
    
    // Generate HMAC
    const hmac = await this.generateHMAC(entry.secret, timeStep, algorithm);
    
    // Generate code
    const code = this.generateCode(hmac, digits);
    
    // Calculate time remaining
    const timeRemaining = period - (Math.floor(Date.now() / 1000) % period);
    const progress = ((period - timeRemaining) / period) * 100;
    
    return {
      code: this.formatCode(code, digits),
      timeRemaining,
      progress
    };
  }

  /**
   * Generate HMAC for TOTP
   */
  private static async generateHMAC(secret: string, timeStep: number, algorithm: string): Promise<Uint8Array> {
    // Convert secret to bytes (base32 decode)
    const secretBytes = this.base32Decode(secret);
    
    // Convert time step to 8-byte big-endian
    const timeStepBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      timeStepBytes[i] = timeStep & 0xff;
      timeStep = timeStep >>> 8;
    }
    
    // Generate HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, timeStepBytes);
    return new Uint8Array(signature);
  }

  /**
   * Generate code from HMAC
   */
  private static generateCode(hmac: Uint8Array, digits: number): string {
    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);
    
    return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
  }

  /**
   * Format code with spaces for readability
   */
  private static formatCode(code: string, digits: number): string {
    if (digits === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    } else if (digits === 8) {
      return `${code.slice(0, 4)} ${code.slice(4)}`;
    }
    return code;
  }

  /**
   * Base32 decode (RFC 4648)
   */
  private static base32Decode(encoded: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const input = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    if (input.length === 0) return new Uint8Array(0);
    
    const output = new Uint8Array(Math.floor(input.length * 5 / 8));
    let bits = 0;
    let value = 0;
    let index = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const charIndex = alphabet.indexOf(char);
      
      if (charIndex === -1) continue;
      
      value = (value << 5) | charIndex;
      bits += 5;
      
      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 0xff;
        bits -= 8;
      }
    }
    
    return output.slice(0, index);
  }

  /**
   * Generate a random secret for new TOTP entries
   */
  static generateSecret(): string {
    const bytes = new Uint8Array(20); // 160 bits
    crypto.getRandomValues(bytes);
    return this.base32Encode(bytes);
  }

  /**
   * Base32 encode (RFC 4648)
   */
  private static base32Encode(bytes: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let output = '';
    let bits = 0;
    let value = 0;
    
    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;
      
      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 0x1f];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 0x1f];
    }
    
    return output;
  }

  /**
   * Validate a TOTP code
   */
  static async validateTOTP(entry: TOTPEntry, code: string): Promise<boolean> {
    const currentCode = await this.generateTOTP(entry);
    const cleanCode = code.replace(/\s/g, '');
    const currentCleanCode = currentCode.code.replace(/\s/g, '');
    
    // Check current code
    if (cleanCode === currentCleanCode) {
      return true;
    }
    
    // Check previous and next time steps (window)
    const period = entry.period || this.DEFAULT_PERIOD;
    const timeStep = Math.floor(Date.now() / 1000 / period);
    
    for (let i = -this.WINDOW_SIZE; i <= this.WINDOW_SIZE; i++) {
      if (i === 0) continue; // Already checked current
      
      const testTimeStep = timeStep + i;
      const testHmac = await this.generateHMAC(entry.secret, testTimeStep, entry.algorithm || this.DEFAULT_ALGORITHM);
      const testCode = this.generateCode(testHmac, entry.digits || this.DEFAULT_DIGITS);
      const testFormattedCode = this.formatCode(testCode, entry.digits || this.DEFAULT_DIGITS);
      
      if (cleanCode === testFormattedCode.replace(/\s/g, '')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate QR code URL for TOTP setup
   */
  static generateQRCodeURL(entry: TOTPEntry): string {
    const algorithm = entry.algorithm || this.DEFAULT_ALGORITHM;
    const digits = entry.digits || this.DEFAULT_DIGITS;
    const period = entry.period || this.DEFAULT_PERIOD;
    
    const issuer = entry.issuer || 'LockingMiNDS';
    const accountName = encodeURIComponent(entry.accountName);
    const secret = entry.secret;
    
    const otpauth = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm}&digits=${digits}&period=${period}`;
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
  }

  /**
   * Parse TOTP URL (otpauth://totp/...)
   */
  static parseTOTPURL(url: string): Partial<TOTPEntry> | null {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.protocol !== 'otpauth:' || urlObj.hostname !== 'totp') {
        return null;
      }
      
      const pathname = urlObj.pathname.slice(1); // Remove leading slash
      const [issuer, accountName] = pathname.split(':');
      
      const params = new URLSearchParams(urlObj.search);
      const secret = params.get('secret');
      
      if (!secret) return null;
      
      return {
        accountName: decodeURIComponent(accountName || ''),
        issuer: issuer ? decodeURIComponent(issuer) : undefined,
        secret,
        algorithm: (params.get('algorithm') as 'SHA1' | 'SHA256' | 'SHA512') || 'SHA1',
        digits: parseInt(params.get('digits') || '6') as 6 | 8,
        period: parseInt(params.get('period') || '30')
      };
    } catch (error) {
      console.error('Failed to parse TOTP URL:', error);
      return null;
    }
  }
}
