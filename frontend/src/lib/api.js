const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/**
 * Centralized API client with credentials (cookies) support.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Send cookies
    ...options,
  };

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  auth: {
    sendOtp: (type, identifier) =>
      request("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ type, identifier }),
      }),

    verifyOtp: (type, identifier, otp) =>
      request("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ type, identifier, otp }),
      }),

    refresh: () =>
      request("/auth/refresh", {
        method: "POST",
      }),

    getMe: () => request("/auth/me"),

    logout: () =>
      request("/auth/logout", {
        method: "POST",
      }),

    logoutAll: () =>
      request("/auth/logout-all", {
        method: "POST",
      }),

    updateProfile: (data) =>
      request("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
};

export default api;
