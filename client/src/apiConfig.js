const API_BASE_URL = import.meta.env.VITE_API_URL || "";
export const API = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;
export const GOOGLE_AUTH_URL = `${API_BASE_URL}/api/auth/google`;
