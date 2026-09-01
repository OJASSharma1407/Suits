// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface GoogleAuthRequest {
  credential: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  subscription_plan: string;
  is_verified?: boolean;
  auth_provider?: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface AuthSuccessPayload {
  user: User;
  tokens: TokenResponse;
}
