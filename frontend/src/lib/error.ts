/**
 * Utility helper to safely extract human-readable error strings from any error,
 * including Axios responses and Pydantic 422 validation error objects.
 */
export function getErrorMessage(err: unknown, fallback = "An error occurred. Please try again."): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  const axiosErr = err as {
    response?: {
      data?: {
        message?: unknown;
        detail?: unknown;
        error?: unknown;
      };
    };
    message?: string;
  };

  const data = axiosErr.response?.data;

  if (data) {
    // 1. data.message as string
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    // 2. data.detail as string
    if (typeof data.detail === "string" && data.detail.trim()) {
      return data.detail;
    }

    // 3. data.detail as Pydantic validation error array: [{loc, msg, type, ...}]
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && "msg" in first) {
        const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : "";
        const msg = String(first.msg);
        return field && typeof field === "string" && isNaN(Number(field))
          ? `${field.charAt(0).toUpperCase() + field.slice(1)}: ${msg}`
          : msg;
      }
    }

    // 4. data.detail as object
    if (data.detail && typeof data.detail === "object" && "msg" in (data.detail as Record<string, unknown>)) {
      return String((data.detail as Record<string, unknown>).msg);
    }

    // 5. data.error as string
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  if (axiosErr.message && typeof axiosErr.message === "string" && axiosErr.message.trim()) {
    return axiosErr.message;
  }

  // Fallback if an object with message or detail was passed directly
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.msg === "string") return obj.msg;
  }

  return fallback;
}
