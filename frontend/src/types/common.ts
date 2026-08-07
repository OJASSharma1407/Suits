// Common API response wrapper
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error_code?: string;
}
