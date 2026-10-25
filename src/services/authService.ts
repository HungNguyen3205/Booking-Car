/**
 * DANAVA GO — Authentication & Client Session Service
 * 
 * ARCHITECTURAL NOTICE:
 * This service manages client-side demo sessions for the DANAVA GO interface.
 * It strictly DOES NOT pretend that a localStorage flag is a production authentication system.
 * 
 * PRODUCTION BACKEND INTEGRATION REQUIREMENTS:
 * To promote this to a secure production system, the following backend endpoints must be integrated:
 * 1. POST /api/v1/auth/login         - Exchange credentials (email/phone + password or OTP) for httpOnly JWT / Session Cookie
 * 2. POST /api/v1/auth/register      - Create user profile with phone verification (SMS OTP / Twilio / VNPT)
 * 3. POST /api/v1/auth/verify-otp    - Complete 2FA / OTP challenges
 * 4. GET  /api/v1/auth/me            - Retrieve authenticated user profile with verified permissions
 * 5. POST /api/v1/auth/refresh       - Rotate expired access tokens securely
 * 6. POST /api/v1/auth/logout        - Revoke refresh token and invalidate server session
 * 
 * SECURITY RULES ENFORCED:
 * - Passwords, OTPs, or bearer secrets are NEVER stored in localStorage or sessionStorage.
 * - Client sessions are explicitly tagged as `isDemoSession: true`.
 */

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'customer' | 'partner' | 'admin';
  membershipTier?: 'bronze' | 'silver' | 'gold' | 'diamond';
  rewardPoints?: number;
  avatarUrl?: string;
  createdAt: string;
}

export interface LoginCredentials {
  identifier: string; // Phone or Email
  password?: string;
  otpCode?: string;
}

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email: string;
  password?: string;
}

export interface IAuthService {
  getCurrentUser(): AuthUser | null;
  login(credentials: LoginCredentials): Promise<AuthUser>;
  register(payload: RegisterPayload): Promise<AuthUser>;
  logout(): Promise<void>;
  isDemoSession(): boolean;
  subscribe(callback: (user: AuthUser | null) => void): () => void;
}

const DEMO_SESSION_KEY = 'danava_demo_user_session_v1';

// Default demo user profile for fast sandbox testing
const SAMPLE_DEMO_USER: AuthUser = {
  id: 'usr_demo_01',
  fullName: 'Nguyễn Văn Hùng',
  phone: '0905123456',
  email: 'hung.nguyen@danavago.vn',
  role: 'customer',
  membershipTier: 'gold',
  rewardPoints: 240,
  createdAt: '2026-01-15T08:00:00Z',
};

class ClientAuthService implements IAuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(DEMO_SESSION_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read demo auth session from localStorage', e);
      this.currentUser = null;
    }
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentUser);
      } catch (e) {
        console.error('Auth listener error', e);
      }
    });
  }

  public subscribe(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    // Initial call
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public isDemoSession(): boolean {
    return true; // Always true in frontend sandbox environment
  }

  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    // Simulate real network authentication latency (400ms)
    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanIdentifier = credentials.identifier.trim();
    if (!cleanIdentifier) {
      throw new Error('Vui lòng nhập số điện thoại hoặc email đăng nhập.');
    }

    // Check if logging in with the known demo user identifier
    let user: AuthUser;
    if (
      cleanIdentifier === SAMPLE_DEMO_USER.phone ||
      cleanIdentifier.toLowerCase() === SAMPLE_DEMO_USER.email.toLowerCase()
    ) {
      user = { ...SAMPLE_DEMO_USER };
    } else {
      // Create user session from credentials
      const isEmail = cleanIdentifier.includes('@');
      user = {
        id: `usr_demo_${Date.now().toString(36)}`,
        fullName: isEmail ? cleanIdentifier.split('@')[0] : `Khách hàng ${cleanIdentifier.slice(-4)}`,
        phone: isEmail ? '0905999888' : cleanIdentifier,
        email: isEmail ? cleanIdentifier : `${cleanIdentifier}@danavago.demo`,
        role: 'customer',
        membershipTier: 'bronze',
        rewardPoints: 50,
        createdAt: new Date().toISOString(),
      };
    }

    this.currentUser = user;
    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Could not persist demo user session', e);
    }

    this.notify();
    return user;
  }

  public async register(payload: RegisterPayload): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const cleanName = payload.fullName.trim();
    const cleanPhone = payload.phone.trim().replace(/\s+/g, '');
    const cleanEmail = payload.email.trim().toLowerCase();

    if (!cleanName || cleanName.split(/\s+/).length < 2) {
      throw new Error('Vui lòng nhập họ và tên đầy đủ (ít nhất 2 từ).');
    }
    if (!/^0[35789]\d{8}$/.test(cleanPhone)) {
      throw new Error('Số điện thoại không hợp lệ (cần 10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('Địa chỉ email không đúng định dạng.');
    }

    const newUser: AuthUser = {
      id: `usr_${Date.now().toString(36)}`,
      fullName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      role: 'customer',
      membershipTier: 'bronze',
      rewardPoints: 100, // Welcome bonus
      createdAt: new Date().toISOString(),
    };

    this.currentUser = newUser;
    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.warn('Could not persist demo registered user session', e);
    }

    this.notify();
    return newUser;
  }

  public async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.currentUser = null;
    try {
      localStorage.removeItem(DEMO_SESSION_KEY);
    } catch (e) {
      console.warn('Could not clear demo user session', e);
    }
    this.notify();
  }

  public getSampleDemoUser(): AuthUser {
    return SAMPLE_DEMO_USER;
  }
}

export const authService = new ClientAuthService();
