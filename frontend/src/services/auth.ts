import api from "@/lib/axios";
import type { APIResponse } from "@/types/common";
import type {
  User,
  TokenResponse,
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  GoogleAuthRequest,
  AuthSuccessPayload,
} from "@/types/auth";

export const authService = {
  login: async (data: LoginRequest) => {
    const res = await api.post<APIResponse<TokenResponse>>("/auth/login", data);
    return res.data.data;
  },

  register: async (data: RegisterRequest) => {
    const res = await api.post<APIResponse<User>>("/auth/register", data);
    return res.data;
  },

  verifyOtp: async (data: VerifyOtpRequest) => {
    const res = await api.post<APIResponse<AuthSuccessPayload>>("/auth/verify-otp", data);
    return res.data.data;
  },

  resendOtp: async (data: ResendOtpRequest) => {
    const res = await api.post<APIResponse<null>>("/auth/resend-otp", data);
    return res.data;
  },

  googleLogin: async (data: GoogleAuthRequest) => {
    const res = await api.post<APIResponse<AuthSuccessPayload>>("/auth/google", data);
    return res.data.data;
  },

  getProfile: async () => {
    const res = await api.get<APIResponse<User>>("/auth/profile");
    return res.data.data;
  },

  refreshToken: async (refreshToken: string) => {
    const res = await api.post<APIResponse<TokenResponse>>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return res.data.data;
  },

  updateProfile: async (data: { full_name?: string; avatar_url?: string }) => {
    const res = await api.patch<APIResponse<User>>("/auth/profile", data);
    return res.data.data;
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    const res = await api.post<APIResponse<null>>("/auth/change-password", data);
    return res.data;
  },
};
