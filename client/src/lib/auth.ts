import { apiRequest } from './queryClient';

export interface User {
  id: string;
  email: string;
  accountType: 'free' | 'pro';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  riskScore: number;
  requiresMFA?: boolean;
  deviceFingerprint?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface WebAuthnRegistrationRequest {
  email: string;
  name?: string;
}

export interface WebAuthnAuthenticationRequest {
  email: string;
}

export class AuthService {
  private static readonly BASE_URL = '/api/auth';
  private static accessToken: string | null = null;
  private static refreshToken: string | null = null;

  // Initialize authentication state from localStorage
  static initialize() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Get current authentication status
  static isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current access token
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  // Clear authentication state
  static clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
  }

  // Store authentication state
  private static storeAuth(auth: AuthResult) {
    this.accessToken = auth.accessToken;
    this.refreshToken = auth.refreshToken;
    localStorage.setItem('accessToken', auth.accessToken);
    localStorage.setItem('refreshToken', auth.refreshToken);
    localStorage.setItem('sessionId', auth.sessionId);
    localStorage.setItem('userId', auth.user.id);
  }

  // Register new user
  static async register(request: RegisterRequest): Promise<User> {
    const response = await apiRequest('POST', `${this.BASE_URL}/register`, request);
    return response.json();
  }

  // Login with email and password
  static async login(request: LoginRequest): Promise<AuthResult> {
    const response = await apiRequest('POST', `${this.BASE_URL}/login`, request);
    const auth = await response.json();
    this.storeAuth(auth);
    return auth;
  }

  // Logout
  static async logout(): Promise<void> {
    if (!this.accessToken) return;
    
    try {
      await apiRequest('POST', `${this.BASE_URL}/logout`, {}, {
        'Authorization': `Bearer ${this.accessToken}`
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Refresh access token
  static async refreshAccessToken(): Promise<AuthResult> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiRequest('POST', `${this.BASE_URL}/refresh`, {
      refreshToken: this.refreshToken
    });
    const auth = await response.json();
    this.storeAuth(auth);
    return auth;
  }

  // Get current user info
  static async getCurrentUser(): Promise<User> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await apiRequest('GET', `${this.BASE_URL}/me`, undefined, {
      'Authorization': `Bearer ${this.accessToken}`
    });
    return response.json();
  }

  // WebAuthn Registration - Step 1: Get challenge
  static async getWebAuthnRegistrationChallenge(request: WebAuthnRegistrationRequest): Promise<any> {
    const response = await apiRequest('POST', `${this.BASE_URL}/webauthn/register/begin`, request);
    return response.json();
  }

  // WebAuthn Registration - Step 2: Complete registration
  static async completeWebAuthnRegistration(registrationResponse: any): Promise<User> {
    const response = await apiRequest('POST', `${this.BASE_URL}/webauthn/register/complete`, {
      credential: registrationResponse
    });
    return response.json();
  }

  // WebAuthn Authentication - Step 1: Get challenge
  static async getWebAuthnAuthenticationChallenge(request: WebAuthnAuthenticationRequest): Promise<any> {
    const response = await apiRequest('POST', `${this.BASE_URL}/webauthn/authenticate/begin`, request);
    return response.json();
  }

  // WebAuthn Authentication - Step 2: Complete authentication
  static async completeWebAuthnAuthentication(authenticationResponse: any): Promise<AuthResult> {
    const response = await apiRequest('POST', `${this.BASE_URL}/webauthn/authenticate/complete`, {
      credential: authenticationResponse
    });
    const auth = await response.json();
    this.storeAuth(auth);
    return auth;
  }

  // Check if WebAuthn is supported
  static isWebAuthnSupported(): boolean {
    return !!(navigator.credentials && navigator.credentials.create);
  }

  // Check if platform authenticator (biometric) is available
  static async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isWebAuthnSupported()) return false;
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }

  // Biometric authentication using WebAuthn platform authenticator
  static async authenticateWithBiometric(email: string): Promise<AuthResult> {
    // First get the challenge for biometric authentication
    const challenge = await this.getWebAuthnAuthenticationChallenge({ email });
    
    // Modify challenge for platform authenticator (biometric)
    const credentialOptions = {
      ...challenge,
      allowCredentials: challenge.allowCredentials?.map((cred: any) => ({
        ...cred,
        transports: ['internal'] // Force platform authenticator
      })),
      userVerification: 'required' // Require biometric verification
    };

    // Get WebAuthn credential using biometric
    const credential = await navigator.credentials.get({
      publicKey: credentialOptions
    });

    // Complete authentication
    return this.completeWebAuthnAuthentication(credential);
  }

  // Passwordless authentication (magic link simulation)
  static async initiatePasswordlessLogin(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest('POST', `${this.BASE_URL}/passwordless/initiate`, { email });
    return response.json();
  }

  // Complete passwordless authentication
  static async completePasswordlessLogin(token: string): Promise<AuthResult> {
    const response = await apiRequest('POST', `${this.BASE_URL}/passwordless/complete`, { token });
    const auth = await response.json();
    this.storeAuth(auth);
    return auth;
  }
}

// Error types for better error handling
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class WebAuthnError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WebAuthnError';
  }
}

// Initialize auth service
AuthService.initialize();