import { generateKeyPairSync, KeyObject } from 'crypto';
import { SignJWT, exportJWK, importPKCS8, importSPKI } from 'jose';

interface RSAKeyPair {
  privateKey: string;  // PEM string
  publicKey: string;   // PEM string
  kid: string;
}

export class RSAKeyService {
  private static keyPair: RSAKeyPair | null = null;
  private static readonly KEY_ID = 'lockmind-oidc-rsa-key-1';

  static initialize(): void {
    if (!this.keyPair) {
      console.log('Generating RSA keypair for OIDC...');
      const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      this.keyPair = {
        privateKey: privateKey as string,
        publicKey: publicKey as string,
        kid: this.KEY_ID
      };
      console.log('RSA keypair generated successfully');
    }
  }

  static getKeyPair(): RSAKeyPair {
    if (!this.keyPair) {
      this.initialize();
    }
    return this.keyPair!;
  }

  static async generateOIDCToken(payload: any): Promise<string> {
    const keyPair = this.getKeyPair();
    
    const jwt = new SignJWT(payload)
      .setProtectedHeader({ 
        alg: 'RS256', 
        typ: 'JWT',
        kid: keyPair.kid 
      })
      .setIssuedAt()
      .setExpirationTime('1h');

    // Use PEM private key directly
    const privateKey = await importPKCS8(keyPair.privateKey, 'RS256');
    return jwt.sign(privateKey);
  }

  static async getJWKS(): Promise<any> {
    try {
      console.log('RSAKeyService.getJWKS() called');
      const keyPair = this.getKeyPair();
      console.log('Got key pair, kid:', keyPair.kid);
      
      // Use PEM public key directly
      console.log('Using public key PEM (first 100 chars):', keyPair.publicKey.substring(0, 100));
      
      const publicKey = await importSPKI(keyPair.publicKey, 'RS256');
      console.log('Imported SPKI key successfully');
      
      const jwk = await exportJWK(publicKey);
      console.log('Exported JWK successfully:', jwk);
      
      const result = {
        keys: [
          {
            ...jwk,
            alg: 'RS256',
            use: 'sig',
            kid: keyPair.kid
          }
        ]
      };
      
      console.log('Final JWKS result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Error in RSAKeyService.getJWKS():', error);
      console.error('Error stack:', (error as Error).stack);
      throw error;
    }
  }

  static getKeyId(): string {
    return this.KEY_ID;
  }
}

// Initialize on module load
RSAKeyService.initialize();